# MCP Interface Architecture
## Unified Communication Protocol for SNES Development Ecosystem

### Lead Architect: Alex
### Version: 1.0.0
### Status: CANONICAL SPECIFICATION

---

## 1. ARCHITECTURAL PRINCIPLES

### Core Tenets
1. **Type Safety First**: Every MCP message must be strongly typed
2. **Single Responsibility**: Each MCP server handles one domain
3. **Fail-Fast Validation**: Validate at boundaries, trust internally
4. **Immutable Messages**: All MCP communications are immutable
5. **Explicit Contracts**: No implicit behavior or magic strings

### Design Patterns
- **Command Pattern**: All MCP operations as discrete commands
- **Repository Pattern**: Unified data access through MCP
- **Adapter Pattern**: Tool-specific adapters for MCP protocol
- **Observer Pattern**: Event-driven updates across tools

---

## 2. MCP SERVER RESPONSIBILITIES

### snes-mcp-server (Documentation & Reference)
```typescript
interface SnesMcpServer {
  // Core responsibilities
  lookupInstruction(mnemonic: string): InstructionDetails;
  queryMemoryMap(address: number): MemoryRegion;
  getRegisterInfo(register: string): RegisterSpec;
  generateTemplate(type: TemplateType): AssemblyCode;
}
```

### bsnes-mcp-server (Emulation & Debugging)
```typescript
interface BsnesMcpServer {
  // Core responsibilities
  readMemory(address: number, size?: number): number | number[];
  writeMemory(address: number, value: number | number[]): void;
  setBreakpoint(address: number, condition?: string): BreakpointId;
  stepExecution(): ProcessorState;
  getTrace(): TraceEntry[];
}
```

### zelda3-mcp-server (Game Logic & Mechanics)
```typescript
interface Zelda3McpServer {
  // Core responsibilities
  findFunction(name: string): FunctionDefinition;
  findSprite(id: string): SpriteData;
  analyzeComponent(type: ComponentType): ComponentAnalysis;
  getAssetData(asset: AssetType): AssetInfo;
}
```

---

## 3. UNIFIED MESSAGE PROTOCOL

### Request Structure
```typescript
interface McpRequest<T = unknown> {
  readonly id: string;           // UUID v4
  readonly timestamp: number;    // Unix timestamp
  readonly server: McpServerType; // Target server
  readonly method: string;        // Method to invoke
  readonly params: T;             // Strongly typed parameters
  readonly timeout?: number;      // Optional timeout in ms
  readonly priority?: Priority;   // Request priority
}
```

### Response Structure
```typescript
interface McpResponse<T = unknown> {
  readonly id: string;           // Matching request ID
  readonly timestamp: number;    // Response timestamp
  readonly server: McpServerType; // Responding server
  readonly status: ResponseStatus; // Success/Error/Timeout
  readonly data?: T;              // Response data if successful
  readonly error?: McpError;      // Error details if failed
  readonly metadata?: Metadata;   // Optional metadata
}
```

### Error Handling
```typescript
interface McpError {
  readonly code: ErrorCode;       // Standardized error codes
  readonly message: string;       // Human-readable message
  readonly details?: unknown;     // Additional error context
  readonly stack?: string;        // Stack trace for debugging
  readonly recoverable: boolean;  // Can retry?
}

enum ErrorCode {
  INVALID_PARAMS = 'INVALID_PARAMS',
  METHOD_NOT_FOUND = 'METHOD_NOT_FOUND',
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMITED = 'RATE_LIMITED'
}
```

---

## 4. TYPE-SAFE CLIENT IMPLEMENTATION

### Base MCP Client
```typescript
abstract class McpClient<TServer extends McpServer> {
  protected abstract readonly serverType: McpServerType;
  
  protected async call<TParams, TResult>(
    method: keyof TServer,
    params: TParams
  ): Promise<TResult> {
    const request: McpRequest<TParams> = {
      id: generateUuid(),
      timestamp: Date.now(),
      server: this.serverType,
      method: String(method),
      params,
      timeout: 30000 // 30 second default
    };
    
    const response = await this.sendRequest(request);
    
    if (response.status !== 'success') {
      throw new McpClientError(response.error);
    }
    
    return response.data as TResult;
  }
  
  private async sendRequest<T>(request: McpRequest): Promise<McpResponse<T>> {
    // Validate request schema
    this.validateRequest(request);
    
    // Send through MCP transport
    const response = await this.transport.send(request);
    
    // Validate response schema
    this.validateResponse(response);
    
    return response;
  }
  
  private validateRequest(request: McpRequest): void {
    // Use Zod for runtime validation
    const schema = McpRequestSchema.parse(request);
    
    // Additional business logic validation
    if (request.timeout && request.timeout > 60000) {
      throw new ValidationError('Timeout cannot exceed 60 seconds');
    }
  }
  
  private validateResponse(response: unknown): McpResponse {
    return McpResponseSchema.parse(response);
  }
}
```

### Concrete Implementation Example
```typescript
class SnesMcpClient extends McpClient<SnesMcpServer> {
  protected readonly serverType = McpServerType.SNES;
  
  async lookupInstruction(mnemonic: string): Promise<InstructionDetails> {
    return this.call('lookupInstruction', { mnemonic });
  }
  
  async queryMemoryMap(address: number): Promise<MemoryRegion> {
    return this.call('queryMemoryMap', { address });
  }
}
```

---

## 5. CROSS-TOOL ORCHESTRATION

### Unified Controller
```typescript
class UnifiedMcpController {
  private readonly snes: SnesMcpClient;
  private readonly bsnes: BsnesMcpClient;
  private readonly zelda3: Zelda3McpClient;
  
  constructor() {
    // Initialize with proper dependency injection
    this.snes = new SnesMcpClient(transport);
    this.bsnes = new BsnesMcpClient(transport);
    this.zelda3 = new Zelda3McpClient(transport);
  }
  
  /**
   * Example: Cross-tool workflow for finding and modifying a sprite
   */
  async modifySprite(spriteName: string, modifications: SpriteModifications): Promise<void> {
    // 1. Get sprite definition from zelda3
    const spriteData = await this.zelda3.findSprite(spriteName);
    
    // 2. Look up memory layout from snes
    const memoryRegion = await this.snes.queryMemoryMap(spriteData.address);
    
    // 3. Validate memory is writable
    if (memoryRegion.access !== 'read/write') {
      throw new Error(`Cannot modify read-only region at ${spriteData.address}`);
    }
    
    // 4. Apply modifications through bsnes
    await this.bsnes.writeMemory(spriteData.address, modifications.data);
    
    // 5. Verify modification
    const verifyData = await this.bsnes.readMemory(spriteData.address, modifications.data.length);
    
    if (!arraysEqual(verifyData, modifications.data)) {
      throw new Error('Modification verification failed');
    }
  }
}
```

---

## 6. VALIDATION SCHEMAS

### Zod Schemas for Runtime Validation
```typescript
import { z } from 'zod';

const McpServerTypeSchema = z.enum(['snes', 'bsnes', 'zelda3', 'snes2asm']);

const PrioritySchema = z.enum(['low', 'normal', 'high', 'critical']);

const ResponseStatusSchema = z.enum(['success', 'error', 'timeout', 'cancelled']);

const McpRequestSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number().positive(),
  server: McpServerTypeSchema,
  method: z.string().min(1),
  params: z.unknown(),
  timeout: z.number().positive().max(60000).optional(),
  priority: PrioritySchema.optional()
});

const McpErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  stack: z.string().optional(),
  recoverable: z.boolean()
});

const McpResponseSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number().positive(),
  server: McpServerTypeSchema,
  status: ResponseStatusSchema,
  data: z.unknown().optional(),
  error: McpErrorSchema.optional(),
  metadata: z.record(z.unknown()).optional()
});
```

---

## 7. PERFORMANCE REQUIREMENTS

### Latency Targets
- **Local MCP calls**: < 10ms
- **Memory operations**: < 5ms
- **File operations**: < 100ms
- **Complex analysis**: < 1000ms

### Throughput Requirements
- **Minimum**: 100 requests/second
- **Target**: 1000 requests/second
- **Burst**: 5000 requests/second

### Resource Limits
- **Max request size**: 10MB
- **Max response size**: 50MB
- **Connection pool**: 10 concurrent
- **Request queue**: 1000 pending

---

## 8. SECURITY CONSIDERATIONS

### Authentication
- Token-based authentication for production
- Development mode with relaxed security
- Rate limiting per client

### Authorization
- Method-level permissions
- Read/write separation
- Admin operations isolated

### Data Protection
- No ROM data in logs
- Sanitized error messages
- Encrypted transport option

---

## 9. TESTING REQUIREMENTS

### Unit Tests
- 100% coverage for validation logic
- Schema validation tests
- Error handling paths

### Integration Tests
- Cross-server communication
- Timeout handling
- Concurrent request handling

### Performance Tests
- Load testing at 2x throughput
- Latency percentile tracking
- Memory leak detection

---

## 10. MIGRATION STRATEGY

### Phase 1: Interface Definition (Week 1)
- Define all MCP method signatures
- Create TypeScript interfaces
- Generate JSON schemas

### Phase 2: Client Implementation (Week 2)
- Implement base MCP client
- Create server-specific clients
- Add validation layer

### Phase 3: Server Adaptation (Week 3-4)
- Adapt existing tools to MCP protocol
- Implement message handlers
- Add monitoring

### Phase 4: Integration Testing (Week 5)
- Cross-tool workflows
- Performance validation
- Error recovery testing

### Phase 5: Production Deployment (Week 6)
- Gradual rollout
- Monitoring setup
- Documentation

---

## APPENDIX A: COMMON PATTERNS

### Request Batching
```typescript
class BatchedMcpClient extends McpClient {
  private queue: McpRequest[] = [];
  
  async batch<T>(requests: McpRequest[]): Promise<McpResponse<T>[]> {
    // Implementation
  }
}
```

### Circuit Breaker
```typescript
class CircuitBreakerMcpClient extends McpClient {
  private failures = 0;
  private readonly threshold = 5;
  
  protected async sendRequest(request: McpRequest): Promise<McpResponse> {
    if (this.failures >= this.threshold) {
      throw new Error('Circuit breaker open');
    }
    // Implementation
  }
}
```

---

## ARCHITECTURAL DECISION RECORDS

### ADR-001: Zod for Runtime Validation
**Decision**: Use Zod for all runtime validation
**Rationale**: Type safety at runtime boundaries
**Consequences**: Additional dependency, slight performance overhead

### ADR-002: UUID for Request IDs
**Decision**: Use UUID v4 for all request IDs
**Rationale**: Guaranteed uniqueness, no coordination needed
**Consequences**: 36 byte overhead per request

### ADR-003: Immutable Messages
**Decision**: All MCP messages are immutable
**Rationale**: Predictable behavior, easier debugging
**Consequences**: No in-place modifications, potential memory overhead

---

**END OF SPECIFICATION**

This document represents the canonical MCP interface architecture.
Any deviations must be approved by the Lead Architect.