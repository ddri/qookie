# QOOKIETWO.md - Redesigned Workflow Architecture

## Problem Analysis

The current Qookie architecture is too rigid compared to modern workflow automation tools like n8n and Google's new "Workspace Flows". Current limitations:

1. **Fixed sequence**: Generate → Analyze → References (can't reorder/skip)
2. **Single AI model** for entire workflow 
3. **Limited customization** per step
4. **No branching logic** or conditional paths
5. **Hard to extend** with new research steps

## Research Findings

### Google Workspace Flows (2025)
At Google Cloud Next 2025, Google announced **Workspace Flows** - a visual workflow automation tool that allows users to combine apps like Gmail, Google Drive, Calendar, and Spreadsheets to automate work without programming knowledge.

### n8n Technical Architecture

Based on comprehensive research of n8n's architecture:

#### Core Technology Stack
- **Backend**: Node.js with TypeScript (90.5% of codebase)
- **Frontend**: Vue.js (component-based architecture)
- **Architecture**: Microservices-oriented with fair-code licensing
- **Data Flow**: JSON-based with specific data structure requirements

#### Data Structure Format
```typescript
// Required format: Array of objects with 'json' wrapper
[
  { json: { property1: "value1", property2: "value2" } },
  { json: { property1: "value3", property2: "value4" } }
]
```

#### Node Types
1. **Trigger Nodes**: Start workflows based on events (webhooks, schedules, etc.)
2. **Action Nodes**: Perform specific tasks (API calls, data transformations)
3. **Condition Nodes**: Control flow with branching logic
4. **AI Nodes**: Integrate with AI services and models

#### INodeType Interface Structure
```typescript
interface INodeType {
  description: INodeTypeDescription;
  execute?(context: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}

interface INodeTypeDescription {
  displayName: string;        // Human-readable name
  name: string;              // Internal identifier (camelCase)
  group: string[];           // Node category
  version: number;           // Always 1 currently
  description: string;       // Node description
  defaults: {
    name: string;
    color: string;
  };
  inputs: string[];          // Input connection types
  outputs: string[];         // Output connection types
  properties: INodeProperties[]; // Configuration UI
}
```

## Redesigned "Qookie Workflows" Architecture

### Core Architecture Changes

**Current**: Rigid 3-step pipeline  
**New**: Visual drag-drop workflow builder with specialized nodes

```
📊 CSV Import → 🤖 AI Research → 📋 Analyze → 📚 References → 📤 Export
     ↓              ↓               ↓            ↓           ↓
  Input Node    LLM Node(s)    Analysis Node  Reference Node  Output Node
```

### Node Types for Quantum Research

#### 1. Input Nodes
- **CSV Import Node**: Load partnership data
- **Manual Entry Node**: Add single partnerships  
- **API Import Node**: Pull from external sources

#### 2. AI Processing Nodes
- **LLM Research Node**: Configurable model + custom prompt
- **Analysis Node**: Metadata extraction (algorithms, industries, personas)
- **Validation Node**: Quality scoring and error checking
- **Reference Collection Node**: Academic/business source gathering

#### 3. Logic & Control Nodes
- **Filter Node**: Process only partnerships matching criteria
- **Conditional Node**: Branch workflows based on data
- **Merge Node**: Combine parallel processing paths
- **Quality Gate Node**: Only pass high-quality results

#### 4. Output Nodes
- **OpenQase Export Node**: Validated export with quality checks
- **GitHub Push Node**: Backup to repositories
- **CSV/JSON Export Node**: Raw data export
- **Individual Files Node**: Separate markdown per partnership

### Technical Implementation

#### Canvas Architecture (React-based)
```typescript
// Each node has standardized interface
interface QookieNode {
  id: string;
  type: 'input' | 'ai' | 'logic' | 'output';
  position: { x: number, y: number };
  config: {
    aiModel?: 'claude-4' | 'gemini-2.5' | 'gpt-4';
    prompt?: string;
    parameters?: Record<string, any>;
  };
  inputs: Connection[];
  outputs: Connection[];
}

interface Workflow {
  id: string;
  name: string;
  nodes: QookieNode[];
  connections: Connection[];
  status: 'draft' | 'running' | 'completed' | 'error';
}
```

#### Per-Node AI Model Selection
```javascript
// Example: Different models for different tasks
Research Node: Claude 4 Opus (best quality)
Analysis Node: Gemini 2.5 Flash (fast categorization)  
References Node: Claude 3.5 Haiku (cost-effective)
```

#### Visual Workflow Builder
- **React Flow** for canvas implementation
- **Node Panel**: Drag-drop node library
- **Configuration Panel**: Per-node settings (model, prompts, parameters)
- **Real-time Execution**: Visual progress indicators
- **Data Preview**: Inspect outputs at each node

### Massive Benefits Over Current System

#### 1. Ultimate Flexibility
- **Reorderable Steps**: Change sequence without code changes
- **Parallel Processing**: Run analysis + references simultaneously  
- **Custom Workflows**: Create domain-specific research pipelines
- **Conditional Logic**: Skip steps based on data quality

#### 2. Cost Optimization
- **Per-Node Model Selection**: Use expensive models only where needed
- **Conditional Execution**: Skip unnecessary processing
- **Batch Controls**: Different rate limits per node type

#### 3. Research Templates  
- **"Basic Research"**: Import → Research → Export
- **"Deep Analysis"**: Import → Research → Analyze → Validate → References → Export
- **"Quality Control"**: Import → Filter → Research → Quality Gate → Export
- **"Multi-Format Export"**: Research → Split → [OpenQase Export | GitHub Push | CSV Export]

#### 4. Advanced Use Cases
```
Partnership CSV → Filter (Year >= 2023) → Research Node (Claude 4) 
                                      ↓
                               Analysis Node (Gemini) → Quality Gate (>80%) 
                                      ↓                        ↓
                               References Node              Export Node
```

## Migration Strategy

### Phase 1: Foundation (2-3 weeks)
1. **Install React Flow**: Add workflow canvas library
2. **Create Node System**: Base node components and interfaces
3. **Basic Canvas**: Drag-drop functionality
4. **Data Flow Engine**: Execute simple linear workflows

### Phase 2: Core Nodes (3-4 weeks)  
1. **Input Nodes**: CSV Import, Manual Entry
2. **AI Nodes**: Configurable LLM Research node with model selection
3. **Output Nodes**: Basic export functionality
4. **Migration Helper**: Convert existing rigid workflows to node-based

### Phase 3: Advanced Features (4-5 weeks)
1. **Logic Nodes**: Conditionals, filters, quality gates  
2. **Template System**: Pre-built workflow templates
3. **Advanced Exports**: OpenQase validation, GitHub integration
4. **Performance**: Parallel execution, caching

### Phase 4: Polish (2-3 weeks)
1. **UI/UX**: Professional workflow builder interface
2. **Documentation**: Workflow building guides
3. **Import Legacy**: Migrate existing case studies

## Key Technical Patterns for React Implementation

### Component-Based Node System
Each node type as a separate component with standardized interface

### JSON Schema Configuration
Use schema-driven UI generation for node properties

### Event-Driven Architecture
Workflow execution as event-driven system

### Canvas State Management
Centralized state for workflow, nodes, and connections

### Modular Plugin Architecture
Extensible system for adding new node types

## Recommended React Libraries

1. **Canvas Component**: React Flow for visual workflow building
2. **Node Factory Pattern**: Dynamic node creation based on type definitions
3. **Context API**: Manage workflow state, execution status, and data flow
4. **Hook-based Execution**: Custom hooks for node execution and data transformation
5. **TypeScript Interfaces**: Strong typing for node definitions and data structures

## Data Management Strategy

- **Immutable State**: Use libraries like Immer for workflow state management
- **Async Execution**: Promise-based node execution with proper error handling
- **Caching Strategy**: Cache node outputs and intermediate results
- **Real-time Updates**: WebSocket or polling for execution status updates

## Result

**Qookie becomes a flexible research automation platform**

Instead of "quantum case study processor," it becomes **"AI Research Workflow Builder"** - applicable to any CSV-based research task with customizable AI processing pipelines.

This redesign would make Qookie significantly more powerful and flexible than the current rigid system, positioning it as a comprehensive workflow automation tool for AI-powered research tasks.

---

# DETAILED PRODUCT PLANNING - EPICS & PHASES

## Industry Best Practices Research

### React Flow Performance Optimization
Based on production experience, React Flow requires careful optimization:

**Critical Performance Rules:**
1. **Memoization is Mandatory**: All objects/functions passed to ReactFlow must use `useMemo`/`useCallback`
2. **Node Components**: Use `React.memo` or declare outside parent components
3. **Large Workflows**: Implement virtualization for 500+ nodes
4. **CSS Simplification**: Avoid complex animations, gradients, shadows on nodes

**Code Pattern:**
```javascript
// GOOD - Memoized node types
const nodeTypes = useMemo(() => ({
  aiResearch: AIResearchNode,
  dataProcessor: DataProcessorNode
}), []);

// BAD - Causes re-renders
const nodeTypes = {
  aiResearch: () => <AIResearchNode />  // Anonymous function
};
```

### Workflow UX Standards (2024-2025)

**n8n's Approach:**
- 400-1000+ built-in integrations
- HTTP Request node for custom APIs
- JavaScript/Python code injection capability
- Modular node-based system

**Zapier's Evolution:**
- Linear trigger → action flow
- 7000+ app integrations
- New Canvas feature for visual planning
- AI-powered workflow creation

**Microsoft Power Automate Updates:**
- AI-powered designer with Copilot
- Left-side configuration pane
- Expression builder modal
- Settings for timeout, retry, security

### Data Flow Architecture Patterns

**Modern Execution Patterns (2024):**
1. **Event-Driven**: Queue-based task dispatch with outbox pattern
2. **Microservices**: Database-per-service with API communication
3. **Resilience**: Automatic retry, circuit breakers, graceful degradation
4. **Resource Management**: Auto-tuning based on CPU/memory usage

---

## EPIC 1: FOUNDATION LAYER
**Duration**: 3-4 weeks  
**Goal**: Establish core workflow canvas and node system architecture

### Phase 1.1: Canvas Infrastructure (Week 1)

#### Tasks:
1. **Install and Configure React Flow**
   ```bash
   npm install reactflow @reactflow/node-resizer @reactflow/controls
   ```
   
2. **Create Base Canvas Component**
   ```typescript
   // src/workflow/WorkflowCanvas.tsx
   interface WorkflowCanvasProps {
     workflow: Workflow;
     onWorkflowChange: (workflow: Workflow) => void;
     isExecuting: boolean;
   }
   ```

3. **Implement Zustand Store for Workflow State**
   ```typescript
   // src/stores/workflowStore.ts
   interface WorkflowStore {
     nodes: Node[];
     edges: Edge[];
     workflows: Workflow[];
     activeWorkflowId: string | null;
     addNode: (node: Node) => void;
     updateNode: (nodeId: string, data: Partial<Node>) => void;
     deleteNode: (nodeId: string) => void;
     addEdge: (edge: Edge) => void;
     deleteEdge: (edgeId: string) => void;
   }
   ```

4. **Setup Performance Monitoring**
   - Implement React DevTools Profiler integration
   - Add render count tracking for optimization
   - Create performance dashboard component

#### Research Tasks:
- Study React Flow's performance documentation
- Analyze n8n's canvas implementation (open source)
- Review Zapier Canvas beta features

#### Deliverables:
- Working canvas with zoom/pan capabilities
- Basic node drag and drop
- Performance baseline metrics

### Phase 1.2: Node System Architecture (Week 2)

#### Tasks:
1. **Define Core Node Interfaces**
   ```typescript
   interface BaseNode {
     id: string;
     type: NodeType;
     position: Position;
     data: NodeData;
   }
   
   interface NodeDefinition {
     type: string;
     category: 'input' | 'ai' | 'logic' | 'output';
     displayName: string;
     description: string;
     icon: string;
     color: string;
     inputs: PortDefinition[];
     outputs: PortDefinition[];
     properties: PropertyDefinition[];
     execute: (context: ExecutionContext) => Promise<ExecutionResult>;
   }
   ```

2. **Create Node Registry System**
   - Dynamic node registration
   - Category-based organization
   - Search and filter capabilities

3. **Implement Node Factory Pattern**
   ```typescript
   class NodeFactory {
     private nodeTypes: Map<string, NodeDefinition>;
     
     registerNode(definition: NodeDefinition): void;
     createNode(type: string, position: Position): BaseNode;
     getNodeDefinition(type: string): NodeDefinition;
     getNodesByCategory(category: string): NodeDefinition[];
   }
   ```

4. **Build Node Component System**
   - Base node component with standard ports
   - Custom node wrapper for specific types
   - Port connection validation system

#### Research Tasks:
- Study n8n's node type definitions
- Analyze Make.com's module system
- Research Temporal.io's workflow definitions

#### Deliverables:
- Extensible node system architecture
- 3-5 basic node types working
- Node creation and deletion functionality

### Phase 1.3: Data Flow Engine (Week 3)

#### Tasks:
1. **Design Execution Context**
   ```typescript
   interface ExecutionContext {
     workflowId: string;
     executionId: string;
     nodeId: string;
     input: any;
     variables: Map<string, any>;
     secrets: Map<string, string>;
     logger: Logger;
   }
   ```

2. **Implement Execution Engine**
   - Topological sort for execution order
   - Async/await based execution
   - Error handling and rollback
   - Progress tracking system

3. **Create Data Transformation Layer**
   - JSON Schema validation
   - Type coercion utilities
   - Data mapping functions
   - Expression evaluation engine

4. **Build Execution Monitoring**
   - Real-time execution status
   - Node execution timing
   - Data flow visualization
   - Error collection and reporting

#### Research Tasks:
- Study Apache Airflow's DAG execution
- Analyze Temporal's workflow execution
- Review n8n's execution model

#### Deliverables:
- Working execution engine for linear workflows
- Data passing between nodes
- Basic error handling

### Phase 1.4: UI Component Library (Week 4)

#### Tasks:
1. **Create Workflow UI Components**
   - Node palette/library panel
   - Property editor panel
   - Execution status bar
   - Variable manager
   - Debug console

2. **Design System Integration**
   - Consistent color scheme
   - Icon system (Lucide React)
   - Typography standards
   - Animation patterns

3. **Build Interactive Elements**
   - Drag handle for nodes
   - Connection ports with hover states
   - Context menus
   - Keyboard shortcuts

#### Deliverables:
- Complete UI component library
- Consistent design system
- Accessibility compliance (WCAG 2.1 AA)

---

## EPIC 2: CORE NODE IMPLEMENTATION
**Duration**: 4-5 weeks  
**Goal**: Build essential nodes for AI research workflows

### Phase 2.1: Input Nodes (Week 5)

#### Tasks:
1. **CSV Import Node**
   ```typescript
   interface CSVImportNode extends NodeDefinition {
     properties: {
       file: FileUpload;
       delimiter: string;
       headers: boolean;
       encoding: string;
     };
     execute: (context) => ParsedCSVData;
   }
   ```

2. **Manual Entry Node**
   - Form-based data entry
   - Schema definition
   - Validation rules
   - Preview capability

3. **API Import Node**
   - HTTP request configuration
   - Authentication options
   - Response parsing
   - Error handling

4. **Database Query Node** (Stretch)
   - Connection configuration
   - Query builder
   - Result mapping

#### Deliverables:
- All input nodes functional
- Data validation working
- Error states handled

### Phase 2.2: AI Processing Nodes (Week 6-7)

#### Tasks:
1. **Universal LLM Node**
   ```typescript
   interface LLMNode extends NodeDefinition {
     properties: {
       provider: 'anthropic' | 'openai' | 'google';
       model: string;
       prompt: string;
       temperature: number;
       maxTokens: number;
       systemPrompt?: string;
     };
   }
   ```

2. **Research Node** (Specialized)
   - Pre-configured for case study generation
   - Template system
   - Variable interpolation
   - Streaming support

3. **Analysis Node**
   - Metadata extraction
   - Categorization
   - Sentiment analysis
   - Entity recognition

4. **Validation Node**
   - Quality scoring
   - Completeness checks
   - Fact verification
   - Confidence scoring

#### Research Tasks:
- Study LangChain's node implementations
- Analyze Flowise AI's node system
- Research prompt engineering best practices

#### Deliverables:
- Working AI nodes with multiple providers
- Streaming response support
- Cost tracking per execution

### Phase 2.3: Logic & Control Nodes (Week 8)

#### Tasks:
1. **Conditional Node**
   ```typescript
   interface ConditionalNode {
     properties: {
       conditions: Condition[];
       defaultPath: string;
     };
     execute: (context) => {
       selectedPath: string;
       output: any;
     };
   }
   ```

2. **Filter Node**
   - Array filtering
   - Object property filtering
   - Regular expression matching
   - Custom JavaScript expressions

3. **Loop Node**
   - For each item processing
   - While conditions
   - Batch processing
   - Parallel execution options

4. **Merge Node**
   - Combine multiple inputs
   - Wait for all inputs
   - Merge strategies (concat, zip, custom)

#### Deliverables:
- All logic nodes implemented
- Branching workflows functional
- Loop and merge patterns working

### Phase 2.4: Output Nodes (Week 9)

#### Tasks:
1. **File Export Node**
   - Multiple format support (JSON, CSV, MD)
   - Template system
   - Compression options
   - Batch export

2. **API Push Node**
   - Webhook configuration
   - Authentication
   - Retry logic
   - Response handling

3. **GitHub Integration Node**
   - Repository selection
   - Branch management
   - Commit creation
   - Pull request automation

4. **OpenQase Export Node**
   - Schema validation
   - Quality checks
   - Batch processing
   - Error reporting

#### Deliverables:
- All output nodes functional
- Export validation working
- Integration tests passing

---

## EPIC 3: ADVANCED FEATURES
**Duration**: 5-6 weeks  
**Goal**: Add enterprise features and optimization

### Phase 3.1: Template System (Week 10)

#### Tasks:
1. **Template Engine**
   ```typescript
   interface WorkflowTemplate {
     id: string;
     name: string;
     description: string;
     category: string;
     thumbnail: string;
     workflow: Workflow;
     variables: Variable[];
     documentation: string;
   }
   ```

2. **Template Library**
   - Pre-built research workflows
   - Industry-specific templates
   - Import/export functionality
   - Version management

3. **Template Customization**
   - Variable substitution
   - Node configuration override
   - Conditional sections
   - Template composition

#### Deliverables:
- 10+ workflow templates
- Template marketplace UI
- Template sharing functionality

### Phase 3.2: Execution Optimization (Week 11-12)

#### Tasks:
1. **Parallel Execution Engine**
   - Worker pool management
   - Task queue system
   - Resource allocation
   - Load balancing

2. **Caching System**
   ```typescript
   interface CacheStrategy {
     key: (node: Node, input: any) => string;
     ttl: number;
     storage: 'memory' | 'disk' | 'redis';
   }
   ```

3. **Performance Monitoring**
   - Execution profiling
   - Bottleneck detection
   - Resource usage tracking
   - Optimization suggestions

4. **Batch Processing**
   - Bulk data handling
   - Chunking strategies
   - Progress reporting
   - Resume capability

#### Research Tasks:
- Study Bull queue system
- Analyze Apache Kafka patterns
- Research Redis caching strategies

#### Deliverables:
- 10x performance improvement for large datasets
- Caching reducing API calls by 50%+
- Parallel execution working

### Phase 3.3: Collaboration Features (Week 13-14)

#### Tasks:
1. **Workflow Versioning**
   - Git-like version control
   - Diff visualization
   - Merge capabilities
   - Rollback functionality

2. **Sharing System**
   - Public/private workflows
   - Permission management
   - Embed functionality
   - API access

3. **Comments & Annotations**
   - Node-level comments
   - Workflow documentation
   - Change requests
   - Review system

4. **Team Features**
   - User management
   - Role-based access
   - Audit logging
   - Activity feed

#### Deliverables:
- Multi-user collaboration working
- Version control implemented
- Sharing functionality complete

### Phase 3.4: Monitoring & Analytics (Week 15)

#### Tasks:
1. **Execution Dashboard**
   ```typescript
   interface ExecutionMetrics {
     totalExecutions: number;
     successRate: number;
     averageDuration: number;
     costByProvider: Map<string, number>;
     errorsByType: Map<string, number>;
   }
   ```

2. **Real-time Monitoring**
   - WebSocket-based updates
   - Live execution view
   - Log streaming
   - Alert system

3. **Analytics Engine**
   - Usage patterns
   - Performance trends
   - Cost analysis
   - ROI calculations

4. **Reporting System**
   - Scheduled reports
   - Custom dashboards
   - Export capabilities
   - API metrics

#### Deliverables:
- Complete monitoring dashboard
- Real-time execution tracking
- Analytics and reporting functional

---

## EPIC 4: MIGRATION & DEPLOYMENT
**Duration**: 3-4 weeks  
**Goal**: Migrate existing system and prepare for production

### Phase 4.1: Migration Tools (Week 16)

#### Tasks:
1. **Data Migration**
   - Export existing case studies
   - Convert to new format
   - Preserve metadata
   - Validation system

2. **Workflow Converter**
   - Map old pipeline to nodes
   - Configuration migration
   - Prompt preservation
   - Test generation

3. **Backwards Compatibility**
   - Legacy API endpoints
   - Format converters
   - Gradual migration path
   - Rollback capability

#### Deliverables:
- Zero data loss migration
- Automated conversion tools
- Migration documentation

### Phase 4.2: Testing & Quality (Week 17-18)

#### Tasks:
1. **Test Suite**
   - Unit tests (90% coverage)
   - Integration tests
   - E2E tests
   - Performance tests

2. **Quality Assurance**
   - Code review process
   - Security audit
   - Accessibility testing
   - Cross-browser testing

3. **Documentation**
   - API documentation
   - User guides
   - Video tutorials
   - Migration guide

#### Deliverables:
- Comprehensive test coverage
- All critical bugs fixed
- Complete documentation

### Phase 4.3: Deployment & Launch (Week 19)

#### Tasks:
1. **Deployment Pipeline**
   - CI/CD setup
   - Environment configuration
   - Monitoring setup
   - Backup systems

2. **Launch Preparation**
   - Feature flags
   - Gradual rollout
   - Performance baseline
   - Support preparation

3. **Post-Launch**
   - User feedback collection
   - Performance monitoring
   - Bug tracking
   - Iteration planning

#### Deliverables:
- Production deployment
- Monitoring active
- Support system ready

---

## SUCCESS METRICS

### Technical Metrics
- **Performance**: <100ms node execution latency
- **Reliability**: 99.9% uptime
- **Scalability**: Handle 1000+ node workflows
- **API Usage**: 50% reduction through caching

### Business Metrics
- **User Adoption**: 100% migration from old system
- **Productivity**: 5x faster workflow creation
- **Cost Reduction**: 40% lower API costs
- **User Satisfaction**: NPS score >50

### Quality Metrics
- **Code Coverage**: >90% test coverage
- **Bug Rate**: <5 critical bugs per month
- **Performance**: <2s page load time
- **Accessibility**: WCAG 2.1 AA compliant

---

## RISK MITIGATION

### Technical Risks
1. **React Flow Performance**
   - Mitigation: Early performance testing, virtualization
   
2. **Data Loss During Migration**
   - Mitigation: Comprehensive backup, gradual migration

3. **API Rate Limits**
   - Mitigation: Intelligent caching, queue management

### Business Risks
1. **User Adoption Resistance**
   - Mitigation: Gradual rollout, training materials

2. **Increased Complexity**
   - Mitigation: Templates, guided workflows

3. **Cost Overruns**
   - Mitigation: Phased development, MVP approach

---

## TECHNOLOGY DECISIONS

### Core Stack
- **Frontend**: React 18 + TypeScript
- **Canvas**: React Flow
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Redis
- **Queue**: Bull
- **Monitoring**: OpenTelemetry

### Development Tools
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions
- **Documentation**: Docusaurus
- **Analytics**: PostHog
- **Error Tracking**: Sentry

---

## NEXT STEPS

1. **Week 1**: Set up development environment, install React Flow
2. **Week 2**: Build proof of concept with 3 nodes
3. **Week 3**: Validate performance with 100+ nodes
4. **Week 4**: Present POC to stakeholders
5. **Week 5**: Begin Epic 1 implementation

This comprehensive plan transforms Qookie from a rigid pipeline into a flexible, enterprise-grade workflow automation platform for AI research tasks.