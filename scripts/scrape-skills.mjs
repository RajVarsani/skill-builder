import axios from "axios";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATASET_DIR = join(__dirname, "..", "dataset");
const BASE_URL = "https://skills.sh/api/skills/all-time";
const CHUNK_SIZE = 1000; // skills per JSON chunk file
const CONCURRENCY = 5; // parallel requests
const DELAY_MS = 200; // delay between batches to be polite

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    accept: "*/*",
    "ngrok-skip-browser-warning": "69420",
    referer: "https://skills.sh/",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  },
  timeout: 30000,
});

async function fetchPage(page) {
  const { data } = await client.get(`/${page}`);
  return data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeAll() {
  console.log("Starting skills scrape from skills.sh...\n");

  // Fetch page 1 to get total count
  const first = await fetchPage(1);
  const total = first.total;
  const perPage = first.skills.length; // 200
  const totalPages = Math.ceil(total / perPage);

  console.log(`Total skills: ${total}`);
  console.log(`Per page: ${perPage}`);
  console.log(`Total pages: ${totalPages}\n`);

  // Collect all skills
  const allSkills = [...first.skills];
  console.log(`Page 1/${totalPages} - fetched ${first.skills.length} skills`);

  // Fetch remaining pages in batches
  let page = 2;
  while (page <= totalPages) {
    const batch = [];
    for (let i = 0; i < CONCURRENCY && page <= totalPages; i++, page++) {
      batch.push(page);
    }

    const results = await Promise.allSettled(batch.map((pg) => fetchPage(pg)));

    for (let i = 0; i < results.length; i++) {
      const { status, value, reason } = results[i];
      const pg = batch[i];

      if (status === "fulfilled") {
        allSkills.push(...value.skills);
        console.log(
          `Page ${pg}/${totalPages} - fetched ${value.skills.length} skills`
        );
      } else {
        console.error(`Page ${pg} FAILED: ${reason.message}`);
        // Retry once
        try {
          await sleep(1000);
          const retry = await fetchPage(pg);
          allSkills.push(...retry.skills);
          console.log(
            `Page ${pg}/${totalPages} - retried OK, ${retry.skills.length} skills`
          );
        } catch (retryErr) {
          console.error(
            `Page ${pg} RETRY FAILED: ${retryErr.message} - skipping`
          );
        }
      }
    }

    if (page <= totalPages) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nTotal skills collected: ${allSkills.length}`);

  // Write chunks to dataset directory
  await mkdir(DATASET_DIR, { recursive: true });

  const totalChunks = Math.ceil(allSkills.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const chunk = allSkills.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkFile = join(DATASET_DIR, `skills-chunk-${i + 1}.json`);
    await writeFile(
      chunkFile,
      JSON.stringify(
        { chunk: i + 1, totalChunks, count: chunk.length, skills: chunk },
        null,
        2
      )
    );
    console.log(`Wrote ${chunkFile} (${chunk.length} skills)`);
  }

  // Write a metadata/index file
  const meta = {
    scrapedAt: new Date().toISOString(),
    totalSkills: allSkills.length,
    totalChunks,
    chunkSize: CHUNK_SIZE,
    source: "https://skills.sh/api/skills/all-time",
  };
  await writeFile(
    join(DATASET_DIR, "meta.json"),
    JSON.stringify(meta, null, 2)
  );
  console.log(`\nWrote meta.json`);
  console.log("Done!");
}

scrapeAll().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
