# Milestone: EPIC 7: Safe Zones (Cities) / Phase 29: City De-Aggro AI Directives

## 1. Executive Summary

Phase 29 enforces the safe zone rules for all dungeon monsters. When the player enters Sanctuary Haven, pursuing enemies immediately drop aggro and enter a `FLEE` state, retreating away from the player and the sanctuary boundary. Players can safely seek refuge inside the city to catch their breath and prepare for deeper dungeon exploration.

## 2. Technical Decisions & Architecture

- **AI State Machine Update ([`src/modules/Enemy.ts`](file:///c:/Users/matth/dev/Dungeon%20Crawler%20Game%202/Dungeon-Crawler-Game-2/src/modules/Enemy.ts)):** Extended enemy state space with the `FLEE` directive.
- **Dynamic Sanctuary Interception:** During every AI tick, the enemy queries `level.isSafeZone(target.x, target.y)`. If the player is within sanctuary boundaries or if an enemy clips inside, the enemy breaks pathfinding toward the player, calculates an inverse vector, and retreats.
- **TDD Criteria Passed:** Verified that intersecting the safe zone forces active enemies from `AGGRO` into `FLEE` and shifts their velocity away from the safe room.

## 3. Lessons Learned

Calculating the evasion vector directly away from the player while keeping collision sliding intact allows fleeing enemies to glide around outer perimeter walls without getting stuck on outer corners.

## 4. Effortless Audit Toolkit

**Audit Steps:**

1. Open the development server:
   👉 **[http://localhost:5173/](http://localhost:5173/)**
2. Open Developer Tools console (F12).
3. Trigger the safe zone de-aggro audit command:
   ```javascript
   window.audit.testCityDeAggro();
   ```
4. Observe the console confirmation stating the enemy has shifted to `FLEE` state.
5. In game, aggro an enemy outside the city, retreat through the city doorway into Sanctuary Haven, and watch the enemy turn around and flee.
