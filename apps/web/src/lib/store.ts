import { create } from 'zustand'
import type {
  ConversationPhase,
  IdentityBlock,
  MatchedSkill,
  ConversationMessage,
} from '@skill-builder/shared/src/types'

interface ConversationStore {
  conversationId: string | null
  phase: ConversationPhase
  messages: ConversationMessage[]
  blocks: IdentityBlock[]
  matchedSkills: MatchedSkill[]
  chips: string[]
  chipsMultiSelect: boolean
  isStreaming: boolean
  streamingText: string
  toolActivity: string | null
  completion: { percentage: number; blocksDiscovered: number; skillsMatched: number }
  skillMarkdown: string | null

  setConversationId: (id: string) => void
  setPhase: (phase: ConversationPhase) => void
  addMessage: (msg: ConversationMessage) => void
  addBlock: (block: IdentityBlock) => void
  confirmBlock: (blockId: string) => void
  addMatchedSkill: (skill: MatchedSkill) => void
  setChips: (chips: string[], multiSelect: boolean) => void
  clearChips: () => void
  setStreaming: (streaming: boolean) => void
  appendStreamingText: (text: string) => void
  clearStreamingText: () => void
  setToolActivity: (label: string | null) => void
  updateCompletion: (data: { percentage: number; blocksDiscovered: number; skillsMatched: number }) => void
  setBlocks: (blocks: IdentityBlock[]) => void
  setMatchedSkills: (skills: MatchedSkill[]) => void
  setSkillMarkdown: (md: string | null) => void
  rejectSkill: (skillId: string) => void
  reset: () => void
  loadState: (state: {
    phase: ConversationPhase
    messages: ConversationMessage[]
    blocks: IdentityBlock[]
    matchedSkills: MatchedSkill[]
  }) => void
}

export const useConversationStore = create<ConversationStore>((set) => ({
  conversationId: null,
  phase: 'domain_discovery',
  messages: [],
  blocks: [],
  matchedSkills: [],
  chips: [],
  chipsMultiSelect: false,
  isStreaming: false,
  streamingText: '',
  toolActivity: null,
  completion: { percentage: 15, blocksDiscovered: 0, skillsMatched: 0 },
  skillMarkdown: null,

  setConversationId: (id) => set({ conversationId: id }),
  setPhase: (phase) => set({ phase }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  addBlock: (block) => set((s) => ({ blocks: [...s.blocks, block] })),
  confirmBlock: (blockId) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.blockId === blockId ? { ...b, status: 'confirmed' as const } : b
      ),
    })),
  addMatchedSkill: (skill) =>
    set((s) => {
      if (s.matchedSkills.some((ms) => ms.skillId === skill.skillId)) return s
      return { matchedSkills: [...s.matchedSkills, skill] }
    }),
  setChips: (chips, multiSelect) => set({ chips, chipsMultiSelect: multiSelect }),
  clearChips: () => set({ chips: [], chipsMultiSelect: false }),
  setStreaming: (isStreaming) => set({ isStreaming, ...(isStreaming ? {} : { toolActivity: null }) }),
  appendStreamingText: (text) => set((s) => ({ streamingText: s.streamingText + text, toolActivity: null })),
  clearStreamingText: () => set({ streamingText: '' }),
  setToolActivity: (label) => set({ toolActivity: label }),
  updateCompletion: (data) => set({ completion: data }),
  setBlocks: (blocks) => set({ blocks }),
  setMatchedSkills: (matchedSkills) => set({ matchedSkills }),
  setSkillMarkdown: (md) => set({ skillMarkdown: md }),
  rejectSkill: (skillId) =>
    set((s) => ({
      matchedSkills: s.matchedSkills.map((sk) =>
        sk.skillId === skillId
          ? { ...sk, status: (sk.status === 'rejected' ? 'proposed' : 'rejected') as MatchedSkill['status'] }
          : sk
      ),
    })),
  reset: () =>
    set({
      conversationId: null,
      phase: 'domain_discovery',
      messages: [],
      blocks: [],
      matchedSkills: [],
      chips: [],
      chipsMultiSelect: false,
      isStreaming: false,
      streamingText: '',
      toolActivity: null,
      completion: { percentage: 15, blocksDiscovered: 0, skillsMatched: 0 },
      skillMarkdown: null,
    }),
  loadState: (state) =>
    set({
      phase: state.phase,
      messages: state.messages,
      blocks: state.blocks,
      matchedSkills: state.matchedSkills,
    }),
}))
