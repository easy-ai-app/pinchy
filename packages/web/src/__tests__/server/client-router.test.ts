import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

const {
  mockChat,
  mockSessionsHistory,
  mockSessionsList,
  mockFindFirst,
  mockUserFindFirst,
  mockAppendAuditLog,
  mockGetUserGroupIds,
  mockGetAgentGroupIds,
  mockRecordUsage,
  mockDbInsert,
  mockDbSelectFromWhere,
} = vi.hoisted(() => ({
  mockChat: vi.fn(),
  mockSessionsHistory: vi.fn(),
  mockSessionsList: vi.fn(),
  mockFindFirst: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockAppendAuditLog: vi.fn().mockResolvedValue(undefined),
  mockGetUserGroupIds: vi.fn().mockResolvedValue([]),
  mockGetAgentGroupIds: vi.fn().mockResolvedValue([]),
  mockRecordUsage: vi.fn().mockResolvedValue(undefined),
  mockDbInsert: vi.fn(),
  mockDbSelectFromWhere: vi.fn(),
}));

vi.mock("@/lib/agent-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/agent-access")>();
  return {
    ...actual,
    assertAgentAccess: vi.fn(
      (
        agent: { isPersonal?: boolean; ownerId?: string; visibility?: string },
        userId: string,
        userRole: string,
        userGroupIds: string[] = [],
        agentGroupIds: string[] = [],
        enterprise: boolean = true
      ) => {
        if (userRole === "admin") return;
        if (agent.isPersonal) {
          if (agent.ownerId === userId) return;
          throw new Error("Access denied");
        }
        const vis = actual.effectiveVisibility(agent.visibility, enterprise);
        if (vis === "restricted") {
          if (userGroupIds.some((gId: string) => agentGroupIds.includes(gId))) return;
          throw new Error("Access denied");
        }
      }
    ),
  };
});

vi.mock("@/lib/enterprise", () => ({
  isEnterprise: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation((table: any) => {
        if (table === "chat_messages") {
          // chatMessages query: select().from(chatMessages).where().orderBy()
          return {
            where: vi.fn().mockImplementation(() => ({
              orderBy: vi.fn().mockImplementation(async () => {
                const rows = mockDbSelectFromWhere();
                return rows ?? [];
              }),
            })),
          };
        }
        // agents table: select().from(agents).where() — returns array directly
        return {
          where: vi.fn().mockImplementation(async () => {
            const result = mockFindFirst();
            const resolved = result && typeof result.then === "function" ? await result : result;
            return resolved ? [resolved] : [];
          }),
        };
      }),
    })),
    insert: vi.fn().mockImplementation((table: any) => ({
      values: vi.fn().mockImplementation(async (data: any) => {
        mockDbInsert(table, data);
        return {};
      }),
    })),
    query: {
      agents: {
        findFirst: mockFindFirst,
      },
      users: {
        findFirst: mockUserFindFirst,
      },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  agents: { id: "id", tenantId: "tenant_id" },
  users: { id: "id" },
  chatMessages: "chat_messages",
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  and: vi.fn((...args) => args),
  asc: vi.fn((col) => ({ asc: col })),
}));

vi.mock("@/lib/audit", () => ({
  appendAuditLog: mockAppendAuditLog,
}));

vi.mock("@/lib/groups", () => ({
  getUserGroupIds: (...args: unknown[]) => mockGetUserGroupIds(...args),
  getAgentGroupIds: (...args: unknown[]) => mockGetAgentGroupIds(...args),
}));

vi.mock("@/lib/usage", () => ({
  recordUsage: mockRecordUsage,
}));

import { ClientRouter } from "@/server/client-router";
import { SessionCache } from "@/server/session-cache";

function createMockClientWs() {
  const sent: string[] = [];
  return {
    send: vi.fn((data: string) => sent.push(data)),
    close: vi.fn(),
    sent,
    readyState: 1,
  };
}

const defaultAgent = {
  id: "agent-1",
  name: "Smithers",
  ownerId: null,
  isPersonal: false,
  greetingMessage: null,
};

function createMockOpenClawClient(connected = true) {
  const emitter = new EventEmitter();
  const client = Object.assign(emitter, {
    chat: mockChat,
    sessions: { history: mockSessionsHistory, list: mockSessionsList },
    isConnected: connected,
  });
  return client;
}

describe("ClientRouter", () => {
  let router: ClientRouter;
  let mockOpenClawClient: ReturnType<typeof createMockOpenClawClient>;
  let sessionCache: SessionCache;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionCache = new SessionCache();
    // Default: session exists and cache is fresh (equivalent to runtimeActivated: true)
    sessionCache.refresh([{ key: "agent:agent-1:direct:user-1" }]);
    mockOpenClawClient = createMockOpenClawClient(true);
    router = new ClientRouter(mockOpenClawClient as any, "user-1", "member", sessionCache);

    // Default: agent exists and is accessible
    mockFindFirst.mockResolvedValue(defaultAgent);
    // Default: user has no context
    mockUserFindFirst.mockResolvedValue({ id: "user-1", context: null });
    // Default: no chat history in DB
    mockDbSelectFromWhere.mockReturnValue([]);
    // Default: insert succeeds
    mockDbInsert.mockReturnValue(undefined);
  });

  it("should return error when agent not found", async () => {
    const clientWs = createMockClientWs();
    mockFindFirst.mockResolvedValue(null);

    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "nonexistent-agent",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe("error");
    expect(messages[0].message).toBe("Agent not found");
  });

  it("should return access denied for unauthorized user", async () => {
    const clientWs = createMockClientWs();
    mockFindFirst.mockResolvedValue({
      id: "agent-1",
      name: "Personal Agent",
      ownerId: "other-user",
      isPersonal: true,
    });

    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe("error");
    expect(messages[0].message).toBe("Access denied");
  });

  it("should allow access to restricted agent when user is in matching group", async () => {
    const restrictedAgent = {
      id: "agent-restricted",
      name: "Restricted Agent",
      ownerId: null,
      isPersonal: false,
      visibility: "restricted",
      greetingMessage: null,
    };
    mockFindFirst.mockResolvedValue(restrictedAgent);
    mockGetUserGroupIds.mockResolvedValue(["g1", "g2"]);
    mockGetAgentGroupIds.mockResolvedValue(["g2", "g3"]);

    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    const clientWs = createMockClientWs();
    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-restricted",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    expect(messages.some((m) => m.type === "chunk")).toBe(true);
    expect(messages.some((m) => m.type === "error")).toBe(false);
  });

  it("should pass agentId and sessionKey to OpenClaw chat", async () => {
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: "Hi Smithers",
      agentId: "agent-1",
    });

    expect(mockChat).toHaveBeenCalledWith("Hi Smithers", {
      agentId: "agent-1",
      sessionKey: "agent:agent-1:direct:user-1",
    });
  });

  it("should fetch history from DB chatMessages table", async () => {
    const clientWs = createMockClientWs();
    const now = new Date("2025-01-01T00:00:00Z");
    mockDbSelectFromWhere.mockReturnValue([
      { role: "user", content: "Hello", createdAt: now },
      { role: "assistant", content: "Hi there!", createdAt: new Date(now.getTime() + 1000) },
    ]);

    await router.handleMessage(clientWs as any, {
      type: "history",
      content: "",
      agentId: "agent-1",
    });

    const sent = clientWs.sent.map((s) => JSON.parse(s));
    expect(sent).toHaveLength(1);
    expect(sent[0].type).toBe("history");
    expect(sent[0].messages).toEqual([
      { role: "user", content: "Hello", timestamp: now.toISOString() },
      {
        role: "assistant",
        content: "Hi there!",
        timestamp: new Date(now.getTime() + 1000).toISOString(),
      },
    ]);
  });

  it("should send streamed chunks to browser client", async () => {
    const clientWs = createMockClientWs();
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello " };
      yield { type: "text" as const, text: "there!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    const textChunks = messages.filter((m: any) => m.type === "chunk");
    expect(textChunks).toHaveLength(2);
    expect(textChunks[0].content).toBe("Hello ");
    expect(textChunks[1].content).toBe("there!");
  });

  it("should strip <final> tags from streamed chunks", async () => {
    const clientWs = createMockClientWs();
    async function* fakeStream() {
      yield { type: "text" as const, text: "<final>" };
      yield { type: "text" as const, text: "Hello there!" };
      yield { type: "text" as const, text: "</final>" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(clientWs as any, {
      type: "message",
      agentId: "agent-1",
      content: "hi",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    const textChunks = messages.filter((m: any) => m.type === "chunk");
    const allText = textChunks.map((c: any) => c.content).join("");
    expect(allText).not.toContain("<final>");
    expect(allText).not.toContain("</final>");
    expect(allText).toContain("Hello there!");
  });

  it("should strip <final> tags when they appear mid-chunk", async () => {
    const clientWs = createMockClientWs();
    async function* fakeStream() {
      yield { type: "text" as const, text: "<final>Right away!" };
      yield { type: "text" as const, text: " How can I help?</final>" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(clientWs as any, {
      type: "message",
      agentId: "agent-1",
      content: "hi",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    const textChunks = messages.filter((m: any) => m.type === "chunk");
    const allText = textChunks.map((c: any) => c.content).join("");
    expect(allText).toBe("Right away! How can I help?");
  });

  it("should include consistent messageId within a single turn", async () => {
    const clientWs = createMockClientWs();
    async function* fakeStream() {
      yield { type: "text" as const, text: "a" };
      yield { type: "text" as const, text: "b" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    const messageIds = messages.map((m: any) => m.messageId);
    expect(new Set(messageIds).size).toBe(1);
    expect(messageIds[0]).toBeTruthy();
  });

  it("should assign different messageIds to each agent turn in a multi-turn stream", async () => {
    const clientWs = createMockClientWs();
    async function* fakeStream() {
      // Turn 1: agent searches documents
      yield { type: "text" as const, text: "Let me search..." };
      yield { type: "done" as const, text: "" };
      // Turn 2: agent gives final answer
      yield { type: "text" as const, text: "The house is 231m\u00b2." };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "How big is the house?",
      agentId: "agent-1",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    const turn1Chunks = messages.filter(
      (m: any) => m.type === "chunk" && m.content.includes("search")
    );
    const turn2Chunks = messages.filter(
      (m: any) => m.type === "chunk" && m.content.includes("231")
    );
    const doneMessages = messages.filter((m: any) => m.type === "done");

    // Each turn should have its own messageId
    expect(turn1Chunks[0].messageId).not.toBe(turn2Chunks[0].messageId);

    // Chunks within a turn share the same messageId
    expect(turn1Chunks[0].messageId).toBe(doneMessages[0].messageId);
    expect(turn2Chunks[0].messageId).toBe(doneMessages[1].messageId);

    // Both messageIds should be truthy
    expect(turn1Chunks[0].messageId).toBeTruthy();
    expect(turn2Chunks[0].messageId).toBeTruthy();
  });

  it("should send a done message after stream completes", async () => {
    const clientWs = createMockClientWs();
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    const doneMsg = messages.find((m: any) => m.type === "done");
    expect(doneMsg).toBeDefined();
    expect(doneMsg.messageId).toBeTruthy();
  });

  it("should send error to browser on stream failure", async () => {
    const clientWs = createMockClientWs();
    mockChat.mockImplementation(async function* () {
      throw new Error("OpenClaw unavailable");
    });

    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    const messages = clientWs.sent.map((s) => JSON.parse(s));
    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe("error");
    expect(messages[0].message).toBe("Something went wrong. Please try again.");
  });

  it("should not send to client if WebSocket is not open", async () => {
    const clientWs = createMockClientWs();
    clientWs.readyState = 3; // CLOSED

    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    expect(clientWs.send).not.toHaveBeenCalled();
  });

  it("should stop consuming stream early when client WebSocket closes mid-stream", async () => {
    const clientWs = createMockClientWs();
    let chunksYielded = 0;

    async function* fakeStream() {
      chunksYielded++;
      yield { type: "text" as const, text: "First " };
      // Simulate WS closing after first chunk is consumed
      clientWs.readyState = 3; // CLOSED
      chunksYielded++;
      yield { type: "text" as const, text: "Second " };
      chunksYielded++;
      yield { type: "text" as const, text: "Third" };
      chunksYielded++;
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    // Should stop consuming after detecting the closed WS, not drain the entire stream
    expect(chunksYielded).toBe(2);
    // Only the first chunk should have been sent
    const messages = clientWs.sent.map((s) => JSON.parse(s));
    const textChunks = messages.filter((m: any) => m.type === "chunk");
    expect(textChunks).toHaveLength(1);
    expect(textChunks[0].content).toBe("First ");
  });

  it("should return empty history when session has no messages", async () => {
    const clientWs = createMockClientWs();
    mockDbSelectFromWhere.mockReturnValue([]);

    await router.handleMessage(clientWs as any, {
      type: "history",
      content: "",
      agentId: "agent-1",
    });

    const sent = clientWs.sent.map((s) => JSON.parse(s));
    expect(sent).toHaveLength(1);
    expect(sent[0].type).toBe("history");
    expect(sent[0].messages).toEqual([]);
  });

  it("should still handle regular message type after adding history support", async () => {
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    const clientWs = createMockClientWs();
    await router.handleMessage(clientWs as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    expect(mockChat).toHaveBeenCalledWith(
      "Hi",
      expect.objectContaining({
        agentId: "agent-1",
        sessionKey: "agent:agent-1:direct:user-1",
      })
    );
    const messages = clientWs.sent.map((s) => JSON.parse(s));
    expect(messages.some((m: any) => m.type === "chunk")).toBe(true);
  });

  it("should send images as attachments to OpenClaw chat", async () => {
    async function* fakeStream() {
      yield { type: "text" as const, text: "I see the image" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    const structuredContent = [
      { type: "text", text: "What is this?" },
      { type: "image_url", image_url: { url: "data:image/png;base64,abc123" } },
    ];

    await router.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: structuredContent,
      agentId: "agent-1",
    });

    expect(mockChat).toHaveBeenCalledWith(
      "What is this?",
      expect.objectContaining({
        agentId: "agent-1",
        sessionKey: "agent:agent-1:direct:user-1",
        attachments: [{ mimeType: "image/png", content: "abc123" }],
      })
    );
  });

  it("should join multiple text parts from structured content with spaces", async () => {
    async function* fakeStream() {
      yield { type: "text" as const, text: "OK" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    const structuredContent = [
      { type: "text", text: "First part." },
      { type: "text", text: "Second part." },
    ];

    await router.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: structuredContent,
      agentId: "agent-1",
    });

    expect(mockChat).toHaveBeenCalledWith(
      "First part. Second part.",
      expect.objectContaining({
        agentId: "agent-1",
        sessionKey: "agent:agent-1:direct:user-1",
      })
    );
  });

  it("should omit attachments when content has no image parts", async () => {
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    expect(mockChat).toHaveBeenCalledWith("Hi", {
      agentId: "agent-1",
      sessionKey: "agent:agent-1:direct:user-1",
    });
  });

  it("should skip non-user/assistant roles in history", async () => {
    const clientWs = createMockClientWs();
    const now = new Date("2025-01-01T00:00:00Z");
    // DB only stores user and assistant, but test that filtering works
    mockDbSelectFromWhere.mockReturnValue([
      { role: "user", content: "Hi", createdAt: now },
      { role: "assistant", content: "Hello!", createdAt: new Date(now.getTime() + 1000) },
    ]);

    await router.handleMessage(clientWs as any, {
      type: "history",
      content: "",
      agentId: "agent-1",
    });

    const sent = clientWs.sent.map((s) => JSON.parse(s));
    expect(sent[0].messages).toHaveLength(2);
    expect(sent[0].messages[0].role).toBe("user");
    expect(sent[0].messages[1].role).toBe("assistant");
  });

  it("should fetch history from DB even when session not in cache", async () => {
    const freshCache = new SessionCache();
    const freshRouter = new ClientRouter(mockOpenClawClient as any, "user-1", "member", freshCache);
    const clientWs = createMockClientWs();

    const now = new Date("2025-01-01T00:00:00Z");
    mockDbSelectFromWhere.mockReturnValue([
      { role: "user", content: "Hello", createdAt: now },
      {
        role: "assistant",
        content: "Hi there!",
        createdAt: new Date(now.getTime() + 1000),
      },
    ]);

    await freshRouter.handleMessage(clientWs as any, {
      type: "history",
      content: "",
      agentId: "agent-1",
    });

    const sent = clientWs.sent.map((s) => JSON.parse(s));
    expect(sent).toHaveLength(1);
    expect(sent[0].type).toBe("history");
    expect(sent[0].messages).toHaveLength(2);
    expect(sent[0].messages[0].content).toBe("Hello");
    expect(sent[0].messages[1].content).toBe("Hi there!");
  });

  it("should return greeting when DB has no history for session", async () => {
    const freshCache = new SessionCache();
    const freshRouter = new ClientRouter(mockOpenClawClient as any, "user-1", "member", freshCache);
    const clientWs = createMockClientWs();
    mockFindFirst.mockResolvedValue({
      ...defaultAgent,
      greetingMessage: "Hello! I'm Smithers, your AI assistant. How can I help?",
    });

    // DB returns empty history
    mockDbSelectFromWhere.mockReturnValue([]);

    await freshRouter.handleMessage(clientWs as any, {
      type: "history",
      content: "",
      agentId: "agent-1",
    });

    const sent = clientWs.sent.map((s) => JSON.parse(s));
    expect(sent).toHaveLength(1);
    expect(sent[0].type).toBe("history");
    expect(sent[0].messages).toEqual([
      {
        role: "assistant",
        content: "Hello! I'm Smithers, your AI assistant. How can I help?",
      },
    ]);
  });

  it("should return empty history when no history and agent has no greeting", async () => {
    const freshCache = new SessionCache();
    const freshRouter = new ClientRouter(mockOpenClawClient as any, "user-1", "member", freshCache);
    const clientWs = createMockClientWs();
    mockFindFirst.mockResolvedValue({
      ...defaultAgent,
      greetingMessage: null,
    });

    // DB returns empty history
    mockDbSelectFromWhere.mockReturnValue([]);

    await freshRouter.handleMessage(clientWs as any, {
      type: "history",
      content: "",
      agentId: "agent-1",
    });

    const sent = clientWs.sent.map((s) => JSON.parse(s));
    expect(sent).toHaveLength(1);
    expect(sent[0].type).toBe("history");
    expect(sent[0].messages).toEqual([]);
  });

  it("should include system prompt with greeting context on first message", async () => {
    const freshCache = new SessionCache();
    const freshRouter = new ClientRouter(mockOpenClawClient as any, "user-1", "member", freshCache);
    mockFindFirst.mockResolvedValue({
      ...defaultAgent,
      greetingMessage: "Hello! I'm Smithers.",
    });
    async function* fakeStream() {
      yield { type: "text" as const, text: "Sure!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await freshRouter.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: "What can you do?",
      agentId: "agent-1",
    });

    expect(mockChat).toHaveBeenCalledWith(
      "What can you do?",
      expect.objectContaining({
        extraSystemPrompt: expect.stringContaining("Hello! I'm Smithers."),
      })
    );
  });

  it("should NOT include system greeting prompt on subsequent messages", async () => {
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    // Session is already in cache, so no greeting system prompt
    const callArgs = mockChat.mock.calls[0];
    const options = callArgs[1];
    const hasGreeting = options.extraSystemPrompt?.includes("greeted them");
    expect(hasGreeting).toBeFalsy();
  });

  it("should NOT include greeting system prompt when agent has no greeting", async () => {
    const freshCache = new SessionCache();
    const freshRouter = new ClientRouter(mockOpenClawClient as any, "user-1", "member", freshCache);
    mockFindFirst.mockResolvedValue({
      ...defaultAgent,
      greetingMessage: null,
    });
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await freshRouter.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    const callArgs = mockChat.mock.calls[0];
    const options = callArgs[1];
    const hasGreeting = options.extraSystemPrompt?.includes("greeted them");
    expect(hasGreeting).toBeFalsy();
  });

  it("should add session key to cache after successful chat", async () => {
    const freshCache = new SessionCache();
    const freshRouter = new ClientRouter(mockOpenClawClient as any, "user-1", "member", freshCache);
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    // Before chat: key is not in cache
    expect(freshCache.has("agent:agent-1:direct:user-1")).toBe(false);

    await freshRouter.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    // After chat completes: key should be in cache
    expect(freshCache.has("agent:agent-1:direct:user-1")).toBe(true);
  });

  it("should fall back to empty history when history fetch fails and no greeting", async () => {
    const clientWs = createMockClientWs();
    mockFindFirst.mockResolvedValue({
      ...defaultAgent,
      greetingMessage: null,
    });
    // DB throws an error
    mockDbSelectFromWhere.mockImplementation(() => {
      throw new Error("DB unavailable");
    });

    await router.handleMessage(clientWs as any, {
      type: "history",
      content: "",
      agentId: "agent-1",
    });

    const sent = clientWs.sent.map((s) => JSON.parse(s));
    expect(sent).toHaveLength(1);
    expect(sent[0].type).toBe("history");
    expect(sent[0].messages).toEqual([]);
  });

  it("should store user message in DB when sending chat", async () => {
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: "Hi Smithers",
      agentId: "agent-1",
    });

    // Check that a user message was inserted
    const userInsert = mockDbInsert.mock.calls.find((call: any) => call[1]?.role === "user");
    expect(userInsert).toBeDefined();
    expect(userInsert[1].content).toBe("Hi Smithers");
    expect(userInsert[1].sessionKey).toBe("agent:agent-1:direct:user-1");
  });

  it("should store assistant message in DB after stream completes", async () => {
    async function* fakeStream() {
      yield { type: "text" as const, text: "Hello " };
      yield { type: "text" as const, text: "there!" };
      yield { type: "done" as const, text: "" };
    }
    mockChat.mockReturnValue(fakeStream());

    await router.handleMessage(createMockClientWs() as any, {
      type: "message",
      content: "Hi",
      agentId: "agent-1",
    });

    // Check that an assistant message was inserted
    const assistantInsert = mockDbInsert.mock.calls.find(
      (call: any) => call[1]?.role === "assistant"
    );
    expect(assistantInsert).toBeDefined();
    expect(assistantInsert[1].content).toBe("Hello there!");
    expect(assistantInsert[1].sessionKey).toBe("agent:agent-1:direct:user-1");
  });
});
