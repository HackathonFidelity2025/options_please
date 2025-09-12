# ECS Architecture for Options Please

## Overview

This broker simulation game uses an **Entity Component System (ECS)** architecture to manage game data and logic. This approach provides flexibility, reusability, and clean separation between data and behavior.

## Core Concepts

### Entities
Entities are just unique IDs that represent game objects:
- `client_001` - A tech enthusiast client
- `headline_001` - A news headline
- `desk_drawer` - A clickable hotspot on the desk

### Components
Components store data about entities. Each component type holds data for multiple entities:

```javascript
"ClientProfile": {
  "client_001": {
    "name": "OrbisTech Enthusiast",
    "risk_profile": "moderate",
    "open_statement": "I heard OrbisTech has a new product launch..."
  }
}
```

### Systems
Systems contain the game logic that processes entities with specific components:
- **RenderSystem** - Draws entities with `Renderable` components
- **HotspotSystem** - Handles interaction with `Hotspot` components
- **ClientAnalysisSystem** - Evaluates player decisions

## Component Types

| Component | Purpose | Example Data |
|-----------|---------|--------------|
| `ClientProfile` | Client information and preferences | name, risk_profile, investment_amount |
| `Clue` | Market information and rumors | content, reliability, credibility_score |
| `Chart` | Technical analysis data | asset, trend, volatility, support_level |
| `Hotspot` | Interactive desk areas | x, y, w, h, hover_text |
| `OpensEntity` | Links hotspots to content | target entity IDs |
| `Renderable` | Visual representation | sprite, layer, scale, alpha |
| `Clickable` | Interactive behavior | action, cursor |

## Scenario Structure

Scenarios define which entities and hotspots are active:

```javascript
{
  "id": "easy_001",
  "title": "The Product Launch",
  "difficulty": "easy",
  "entities": ["client_001", "headline_001", "chart_001"],
  "hotspots": ["desk_drawer", "monitor"],
  "win_condition": "approve_call",
  "time_limit": 300
}
```

## Game Flow

1. **Load Scenario** - Activate specific entities and hotspots
2. **Player Investigation** - Click hotspots to reveal information
3. **Decision Making** - Recommend actions based on gathered intel
4. **Evaluation** - Score decision based on evidence quality and risk alignment

## Difficulty Progression

- **Tutorial** - Simple scenarios with hints and forgiving scoring
- **Easy** - Clear information, obvious correct choices
- **Medium** - Some conflicting information, requires analysis
- **Hard** - Multiple clients, contradictory data
- **Expert** - Time pressure, crisis events, high stakes

## Implementation Example

```javascript
// Initialize ECS
const ecsManager = new ECSManager(scenarioData);

// Get all clients
const clients = ecsManager.getEntitiesWithComponent('ClientProfile');

// Get client data
const clientData = ecsManager.getComponent('client_001', 'ClientProfile');

// Check if entity has component
const isClickable = ecsManager.hasComponent('client_001', 'Clickable');
```

## Benefits of ECS Architecture

1. **Reusability** - Same headline can appear in multiple scenarios
2. **Flexibility** - Easy to add new component types and combinations  
3. **Data-Driven** - Game content is in JSON, not hardcoded
4. **Modularity** - Systems can be developed and tested independently
5. **Scalability** - Easy to add new scenarios and mechanics

## Adding New Content

### New Client Type
```javascript
// Add to entities array
{"id": "client_003", "components": ["ClientProfile", "Clickable", "Renderable"]}

// Add component data
"ClientProfile": {
  "client_003": {
    "name": "Day Trader",
    "risk_profile": "high",
    "experience_level": "expert"
  }
}
```

### New Information Type
```javascript
// Add new component type
"InsiderTip": {
  "tip_001": {
    "content": "CEO planning major announcement",
    "source": "company_insider",
    "legality": "questionable",
    "reliability": "high"
  }
}
```

### New Interactive Element
```javascript
// Add hotspot entity
{"id": "coffee_machine", "components": ["Hotspot", "OpensEntity"]}

// Configure hotspot
"Hotspot": {
  "coffee_machine": {
    "label": "Coffee Break",
    "x": 300, "y": 500, "w": 80, "h": 100,
    "hover_text": "Overhear office gossip"
  }
}
```

This architecture makes the game highly moddable and easy to expand with new scenarios, client types, and information sources!
