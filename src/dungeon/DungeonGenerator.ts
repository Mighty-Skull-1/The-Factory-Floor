import { Room } from './Room';
import { Direction, GameMode } from '../types';
import { Enemy } from './Enemy';

export class DungeonGenerator {
  public static generateSector(sectorNumber: number = 1, gameMode: GameMode = 'STANDARD'): Room[] {
    const rooms: Room[] = [];

    const connect = (r1Idx: number, r2Idx: number, dir: Direction) => {
      const r1 = rooms[r1Idx];
      const r2 = rooms[r2Idx];
      if (!r1 || !r2) return;

      let opposite: Direction = 'DOWN';
      if (dir === 'UP') opposite = 'DOWN';
      if (dir === 'DOWN') opposite = 'UP';
      if (dir === 'LEFT') opposite = 'RIGHT';
      if (dir === 'RIGHT') opposite = 'LEFT';

      const d1 = DungeonGenerator.createDoor(r1, dir, r2Idx);
      const d2 = DungeonGenerator.createDoor(r2, opposite, r1Idx);

      r1.doors.push(d1);
      r2.doors.push(d2);
    };

    const themeSector = ((sectorNumber - 1) % 3) + 1;

    // =========================================================================
    // ENDLESS MODE EXPANSIVE GAUNTLET LAYOUTS (16 to 18 Rooms per Sector!)
    // =========================================================================
    if (gameMode === 'ENDLESS') {
      if (themeSector === 1) {
        // ENDLESS SECTOR 1: STEAM MEGA-FORGE GAUNTLET (16 Rooms)
        const configs = [
          { id: 'room_0', type: 'START' as const, gx: 0, gy: 1 },
          { id: 'room_1', type: 'WORKSHOP' as const, gx: -1, gy: 0 },
          { id: 'room_2', type: 'ESCAPE_POD' as const, gx: -1, gy: 1 },
          { id: 'room_3', type: 'COMBAT' as const, gx: 0, gy: 0 },
          { id: 'room_4', type: 'COMBAT' as const, gx: 0, gy: -1 },
          { id: 'room_5', type: 'COMBAT' as const, gx: 1, gy: -1 },
          { id: 'room_6', type: 'COMBAT' as const, gx: 1, gy: 0 },
          { id: 'room_7', type: 'COMBAT' as const, gx: 1, gy: 1 },
          { id: 'room_8', type: 'COMBAT' as const, gx: 2, gy: 1 },
          { id: 'room_9', type: 'COMBAT' as const, gx: 2, gy: 0 },
          { id: 'room_10', type: 'COMBAT' as const, gx: 2, gy: -1 },
          { id: 'room_11', type: 'COMBAT' as const, gx: 3, gy: -1 },
          { id: 'room_12', type: 'COMBAT' as const, gx: 3, gy: 0 },
          { id: 'room_13', type: 'COMBAT' as const, gx: 3, gy: 1 },
          { id: 'room_14', type: 'COMBAT' as const, gx: 4, gy: 0 },
          { id: 'room_15', type: 'CORE_OVERSEER' as const, gx: 4, gy: -1 },
        ];

        for (const cfg of configs) {
          rooms.push(new Room(cfg.id, cfg.type, cfg.gx, cfg.gy, sectorNumber));
        }

        connect(0, 2, 'LEFT');
        connect(0, 3, 'UP');
        connect(0, 7, 'RIGHT');
        connect(1, 3, 'RIGHT');
        connect(3, 4, 'UP');
        connect(3, 6, 'RIGHT');
        connect(4, 5, 'RIGHT');
        connect(5, 6, 'DOWN');
        connect(5, 10, 'RIGHT');
        connect(6, 7, 'DOWN');
        connect(6, 9, 'RIGHT');
        connect(7, 8, 'RIGHT');
        connect(8, 9, 'UP');
        connect(8, 13, 'RIGHT');
        connect(9, 10, 'UP');
        connect(9, 12, 'RIGHT');
        connect(10, 11, 'RIGHT');
        connect(11, 12, 'DOWN');
        connect(11, 15, 'RIGHT');
        connect(12, 13, 'DOWN');
        connect(12, 14, 'RIGHT');
        connect(14, 15, 'UP');

        // Start Bay
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 400, 320));
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 800, 320));
        rooms[0].lootDrops.push({ x: 550, y: 320, type: 'SCRAP', amount: 15 });
        rooms[0].lootDrops.push({ x: 650, y: 320, type: 'SCRAP', amount: 15 });
        rooms[0].isCleared = true;

        // Workshop
        rooms[1].lootDrops.push({ x: 520, y: 350, type: 'COMPONENT', componentType: 'DYE_VAT_BLUE', amount: 1 });
        rooms[1].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'CUTTER', amount: 1 });

        // Gauntlet Combat Rooms
        rooms[3].enemies.push(new Enemy('SCRAP_DRONE', 400, 260), new Enemy('SCRAP_DRONE', 480, 420), new Enemy('LASER_TURRET', 840, 280));
        rooms[4].enemies.push(new Enemy('SCRAP_DRONE', 380, 340), new Enemy('ROLLER_SENTRY', 550, 450), new Enemy('LASER_TURRET', 780, 240));
        rooms[5].enemies.push(new Enemy('ROLLER_SENTRY', 420, 260), new Enemy('ROLLER_SENTRY', 680, 440), new Enemy('SCRAP_DRONE', 550, 350));
        rooms[6].enemies.push(new Enemy('SCRAP_DRONE', 360, 240), new Enemy('SCRAP_DRONE', 360, 460), new Enemy('LASER_TURRET', 860, 350));
        rooms[7].enemies.push(new Enemy('SCRAP_DRONE', 450, 280), new Enemy('SCRAP_DRONE', 550, 420), new Enemy('ROLLER_SENTRY', 750, 350));
        rooms[8].enemies.push(new Enemy('ROLLER_SENTRY', 400, 250), new Enemy('ROLLER_SENTRY', 700, 450), new Enemy('SCRAP_DRONE', 550, 350));
        rooms[9].enemies.push(new Enemy('LASER_TURRET', 360, 240), new Enemy('LASER_TURRET', 840, 240), new Enemy('SCRAP_DRONE', 600, 450));
        rooms[10].enemies.push(new Enemy('SCRAP_DRONE', 380, 260), new Enemy('SCRAP_DRONE', 480, 440), new Enemy('ROLLER_SENTRY', 780, 350));

        // Mini-Boss 1: Elite Laser Turret
        const elite1 = new Enemy('LASER_TURRET', 600, 350);
        elite1.isElite = true;
        elite1.maxHp = 160;
        elite1.hp = 160;
        rooms[11].enemies.push(elite1, new Enemy('LASER_TURRET', 350, 220), new Enemy('SCRAP_DRONE', 750, 450));

        // Mini-Boss 2: Elite Roller Commander
        const eliteRoll = new Enemy('ROLLER_SENTRY', 600, 350);
        eliteRoll.isElite = true;
        eliteRoll.maxHp = 160;
        eliteRoll.hp = 160;
        rooms[12].enemies.push(eliteRoll, new Enemy('SCRAP_DRONE', 400, 260), new Enemy('SCRAP_DRONE', 780, 440));

        // Side Cache Room (Slag Disposal)
        rooms[13].enemies.push(new Enemy('ROLLER_SENTRY', 480, 320), new Enemy('ROLLER_SENTRY', 720, 320));
        rooms[13].lootDrops.push({ x: 520, y: 350, type: 'SCRAP', amount: 35 });
        rooms[13].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'OVERCLOCKER', amount: 1 });

        // Boss Antechamber
        rooms[14].enemies.push(new Enemy('LASER_TURRET', 350, 240), new Enemy('LASER_TURRET', 850, 460), new Enemy('ROLLER_SENTRY', 600, 350), new Enemy('SCRAP_DRONE', 500, 460));

        // Boss Core Overseer
        rooms[15].enemies.push(new Enemy('OVERSEER_BOSS', 600, 380));

      } else if (themeSector === 2) {
        // ENDLESS SECTOR 2: HIGH-VOLTAGE SUBSTATION COMPLEX (17 Rooms)
        const configs = [
          { id: 'room_0', type: 'START' as const, gx: 0, gy: 3 },
          { id: 'room_1', type: 'WORKSHOP' as const, gx: -1, gy: 1 },
          { id: 'room_2', type: 'ESCAPE_POD' as const, gx: 3, gy: 3 },
          { id: 'room_3', type: 'COMBAT' as const, gx: 0, gy: 2 },
          { id: 'room_4', type: 'COMBAT' as const, gx: 0, gy: 1 },
          { id: 'room_5', type: 'COMBAT' as const, gx: 0, gy: 0 },
          { id: 'room_6', type: 'COMBAT' as const, gx: 1, gy: 0 },
          { id: 'room_7', type: 'COMBAT' as const, gx: 1, gy: 1 },
          { id: 'room_8', type: 'COMBAT' as const, gx: 1, gy: 2 },
          { id: 'room_9', type: 'COMBAT' as const, gx: 1, gy: 3 },
          { id: 'room_10', type: 'COMBAT' as const, gx: 2, gy: 3 },
          { id: 'room_11', type: 'COMBAT' as const, gx: 2, gy: 2 },
          { id: 'room_12', type: 'COMBAT' as const, gx: 2, gy: 1 },
          { id: 'room_13', type: 'COMBAT' as const, gx: 2, gy: 0 },
          { id: 'room_14', type: 'COMBAT' as const, gx: 3, gy: 0 },
          { id: 'room_15', type: 'COMBAT' as const, gx: 3, gy: 1 },
          { id: 'room_16', type: 'CORE_OVERSEER' as const, gx: 4, gy: 0 },
        ];

        for (const cfg of configs) {
          rooms.push(new Room(cfg.id, cfg.type, cfg.gx, cfg.gy, sectorNumber));
        }

        connect(0, 3, 'UP');
        connect(0, 9, 'RIGHT');
        connect(1, 4, 'RIGHT');
        connect(3, 4, 'UP');
        connect(3, 8, 'RIGHT');
        connect(4, 5, 'UP');
        connect(4, 7, 'RIGHT');
        connect(5, 6, 'RIGHT');
        connect(6, 7, 'DOWN');
        connect(6, 13, 'RIGHT');
        connect(7, 8, 'DOWN');
        connect(7, 12, 'RIGHT');
        connect(8, 9, 'DOWN');
        connect(8, 11, 'RIGHT');
        connect(9, 10, 'RIGHT');
        connect(10, 11, 'UP');
        connect(10, 2, 'RIGHT');
        connect(11, 12, 'UP');
        connect(12, 13, 'UP');
        connect(12, 15, 'RIGHT');
        connect(13, 14, 'RIGHT');
        connect(14, 15, 'DOWN');
        connect(14, 16, 'RIGHT');

        // Start Bay
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 400, 320));
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 800, 320));
        rooms[0].lootDrops.push({ x: 550, y: 320, type: 'SCRAP', amount: 18 });
        rooms[0].lootDrops.push({ x: 650, y: 320, type: 'SCRAP', amount: 18 });
        rooms[0].isCleared = true;

        // Workshop
        rooms[1].lootDrops.push({ x: 520, y: 350, type: 'COMPONENT', componentType: 'OVERCLOCKER', amount: 1 });
        rooms[1].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'DYE_VAT_YELLOW', amount: 1 });

        // Gauntlet Combat Rooms
        rooms[3].enemies.push(new Enemy('SPARK_DRONE', 400, 260), new Enemy('SPARK_DRONE', 520, 440), new Enemy('TESLA_TURRET', 840, 340));
        rooms[4].enemies.push(new Enemy('SPARK_DRONE', 420, 280), new Enemy('ROLLER_SENTRY', 650, 450), new Enemy('TESLA_TURRET', 800, 240));
        rooms[5].enemies.push(new Enemy('ROLLER_SENTRY', 450, 280), new Enemy('ROLLER_SENTRY', 750, 440), new Enemy('SPARK_DRONE', 600, 350));
        rooms[6].enemies.push(new Enemy('TESLA_TURRET', 360, 240), new Enemy('TESLA_TURRET', 840, 460), new Enemy('SPARK_DRONE', 600, 350));
        rooms[7].enemies.push(new Enemy('SPARK_DRONE', 400, 260), new Enemy('SPARK_DRONE', 480, 450), new Enemy('ROLLER_SENTRY', 750, 350));
        rooms[8].enemies.push(new Enemy('ROLLER_SENTRY', 480, 280), new Enemy('TESLA_TURRET', 820, 350), new Enemy('SPARK_DRONE', 600, 240));
        rooms[9].enemies.push(new Enemy('SPARK_DRONE', 420, 260), new Enemy('SPARK_DRONE', 480, 460), new Enemy('ROLLER_SENTRY', 760, 350));
        rooms[10].enemies.push(new Enemy('ROLLER_SENTRY', 420, 260), new Enemy('ROLLER_SENTRY', 760, 440), new Enemy('TESLA_TURRET', 600, 350));
        rooms[11].enemies.push(new Enemy('TESLA_TURRET', 360, 250), new Enemy('TESLA_TURRET', 840, 250), new Enemy('SPARK_DRONE', 600, 450));
        rooms[12].enemies.push(new Enemy('SPARK_DRONE', 420, 260), new Enemy('ROLLER_SENTRY', 600, 350), new Enemy('TESLA_TURRET', 820, 450));
        rooms[13].enemies.push(new Enemy('TESLA_TURRET', 360, 240), new Enemy('TESLA_TURRET', 850, 460), new Enemy('SPARK_DRONE', 600, 350));

        // Elite Tesla Bastion
        const eliteTesla = new Enemy('TESLA_TURRET', 600, 350);
        eliteTesla.isElite = true;
        eliteTesla.maxHp = 220;
        eliteTesla.hp = 220;
        rooms[14].enemies.push(eliteTesla, new Enemy('TESLA_TURRET', 350, 220), new Enemy('SPARK_DRONE', 780, 440));

        // Overlord Security Gate
        const eliteRoll2 = new Enemy('ROLLER_SENTRY', 600, 350);
        eliteRoll2.isElite = true;
        eliteRoll2.maxHp = 190;
        eliteRoll2.hp = 190;
        rooms[15].enemies.push(eliteRoll2, new Enemy('SPARK_DRONE', 420, 260), new Enemy('SPARK_DRONE', 780, 440));

        // Boss Volt Warden
        rooms[16].enemies.push(new Enemy('VOLT_WARDEN', 600, 380));

      } else {
        // ENDLESS SECTOR 3+: CYBERNETIC CITADEL HIVE (18 Rooms)
        const configs = [
          { id: 'room_0', type: 'START' as const, gx: 0, gy: 2 },
          { id: 'room_1', type: 'WORKSHOP' as const, gx: -1, gy: 0 },
          { id: 'room_2', type: 'ESCAPE_POD' as const, gx: 3, gy: 0 },
          { id: 'room_3', type: 'COMBAT' as const, gx: 0, gy: 1 },
          { id: 'room_4', type: 'COMBAT' as const, gx: 0, gy: 0 },
          { id: 'room_5', type: 'COMBAT' as const, gx: -1, gy: -1 },
          { id: 'room_6', type: 'COMBAT' as const, gx: -1, gy: -2 },
          { id: 'room_7', type: 'COMBAT' as const, gx: 0, gy: -1 },
          { id: 'room_8', type: 'COMBAT' as const, gx: 0, gy: -2 },
          { id: 'room_9', type: 'COMBAT' as const, gx: 0, gy: -3 },
          { id: 'room_10', type: 'COMBAT' as const, gx: 1, gy: -3 },
          { id: 'room_11', type: 'COMBAT' as const, gx: 1, gy: -2 },
          { id: 'room_12', type: 'COMBAT' as const, gx: 1, gy: -1 },
          { id: 'room_13', type: 'COMBAT' as const, gx: 1, gy: 0 },
          { id: 'room_14', type: 'COMBAT' as const, gx: 2, gy: 0 },
          { id: 'room_15', type: 'COMBAT' as const, gx: 2, gy: -1 },
          { id: 'room_16', type: 'COMBAT' as const, gx: 0, gy: -4 },
          { id: 'room_17', type: 'CORE_OVERSEER' as const, gx: 0, gy: -5 },
        ];

        for (const cfg of configs) {
          rooms.push(new Room(cfg.id, cfg.type, cfg.gx, cfg.gy, sectorNumber));
        }

        connect(0, 3, 'UP');
        connect(3, 4, 'UP');
        connect(4, 1, 'LEFT');
        connect(4, 7, 'UP');
        connect(4, 13, 'RIGHT');
        connect(1, 5, 'UP');
        connect(5, 6, 'UP');
        connect(5, 7, 'RIGHT');
        connect(6, 8, 'RIGHT');
        connect(7, 8, 'UP');
        connect(7, 12, 'RIGHT');
        connect(8, 9, 'UP');
        connect(8, 11, 'RIGHT');
        connect(9, 10, 'RIGHT');
        connect(9, 16, 'UP');
        connect(10, 11, 'DOWN');
        connect(11, 12, 'DOWN');
        connect(12, 13, 'DOWN');
        connect(12, 15, 'RIGHT');
        connect(13, 14, 'RIGHT');
        connect(14, 2, 'RIGHT');
        connect(14, 15, 'UP');
        connect(16, 17, 'UP');

        // Start Bay
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 400, 320));
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 800, 320));
        rooms[0].lootDrops.push({ x: 550, y: 320, type: 'SCRAP', amount: 20 });
        rooms[0].lootDrops.push({ x: 650, y: 320, type: 'SCRAP', amount: 20 });
        rooms[0].isCleared = true;

        // Workshop
        rooms[1].lootDrops.push({ x: 520, y: 350, type: 'COMPONENT', componentType: 'EMITTER_STAR', amount: 1 });
        rooms[1].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'EXPANDER', amount: 1 });

        // Gauntlet Combat Rooms
        rooms[3].enemies.push(new Enemy('SPARK_DRONE', 380, 260), new Enemy('LASER_TURRET', 840, 260), new Enemy('TESLA_TURRET', 840, 460));
        rooms[4].enemies.push(new Enemy('SPARK_DRONE', 420, 260), new Enemy('ROLLER_SENTRY', 600, 360), new Enemy('TESLA_TURRET', 820, 350));
        rooms[5].enemies.push(new Enemy('SPARK_DRONE', 400, 250), new Enemy('SPARK_DRONE', 480, 440), new Enemy('ROLLER_SENTRY', 760, 350));

        // Armory Silo (Bonus Cache)
        rooms[6].enemies.push(new Enemy('ROLLER_SENTRY', 450, 320), new Enemy('ROLLER_SENTRY', 750, 320));
        rooms[6].lootDrops.push({ x: 520, y: 350, type: 'SCRAP', amount: 40 });
        rooms[6].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'DYE_VAT_PURPLE', amount: 1 });

        rooms[7].enemies.push(new Enemy('TESLA_TURRET', 360, 240), new Enemy('LASER_TURRET', 860, 240), new Enemy('ROLLER_SENTRY', 600, 450));
        rooms[8].enemies.push(new Enemy('SPARK_DRONE', 400, 260), new Enemy('SPARK_DRONE', 480, 460), new Enemy('TESLA_TURRET', 820, 350));
        rooms[9].enemies.push(new Enemy('ROLLER_SENTRY', 420, 260), new Enemy('ROLLER_SENTRY', 780, 440), new Enemy('SPARK_DRONE', 600, 350));
        rooms[10].enemies.push(new Enemy('TESLA_TURRET', 360, 240), new Enemy('TESLA_TURRET', 840, 460), new Enemy('SPARK_DRONE', 600, 350));
        rooms[11].enemies.push(new Enemy('SPARK_DRONE', 420, 260), new Enemy('ROLLER_SENTRY', 600, 350), new Enemy('LASER_TURRET', 820, 450));
        rooms[12].enemies.push(new Enemy('TESLA_TURRET', 360, 240), new Enemy('TESLA_TURRET', 850, 460), new Enemy('ROLLER_SENTRY', 600, 350));
        rooms[13].enemies.push(new Enemy('ROLLER_SENTRY', 450, 280), new Enemy('ROLLER_SENTRY', 750, 440), new Enemy('SPARK_DRONE', 600, 350));
        rooms[14].enemies.push(new Enemy('TESLA_TURRET', 360, 240), new Enemy('LASER_TURRET', 850, 460), new Enemy('SPARK_DRONE', 600, 350));

        // Mini-Boss: Elite Cyber Enforcer
        const eliteEnforcer = new Enemy('ENFORCER_ELITE', 600, 350);
        rooms[15].enemies.push(eliteEnforcer, new Enemy('SPARK_DRONE', 380, 240), new Enemy('ROLLER_SENTRY', 780, 440));

        // Guardian Ante-Chamber before Overlord Core
        const eliteCoreGuard = new Enemy('ENFORCER_ELITE', 600, 350);
        rooms[16].enemies.push(eliteCoreGuard, new Enemy('TESLA_TURRET', 350, 240), new Enemy('LASER_TURRET', 850, 240), new Enemy('ROLLER_SENTRY', 600, 460));

        // Boss Overlord Core
        rooms[17].enemies.push(new Enemy('OVERLORD_CORE', 600, 380));
      }

    } else {
      // =========================================================================
      // STANDARD & HARD MODE EXPANDED LAYOUTS (11 to 14 Rooms per Sector!)
      // =========================================================================
      if (themeSector === 1) {
        // SECTOR 1: STEAM FOUNDRY (12 Rooms)
        const configs = [
          { id: 'room_0', type: 'START' as const, gx: 0, gy: 0 },
          { id: 'room_1', type: 'WORKSHOP' as const, gx: 0, gy: -1 },
          { id: 'room_2', type: 'COMBAT' as const, gx: 1, gy: 0 },
          { id: 'room_3', type: 'COMBAT' as const, gx: 2, gy: 0 },
          { id: 'room_4', type: 'COMBAT' as const, gx: 2, gy: -1 },
          { id: 'room_5', type: 'COMBAT' as const, gx: 0, gy: 1 },
          { id: 'room_6', type: 'COMBAT' as const, gx: 1, gy: 1 },
          { id: 'room_7', type: 'COMBAT' as const, gx: 2, gy: 1 },
          { id: 'room_8', type: 'COMBAT' as const, gx: 3, gy: 1 },
          { id: 'room_9', type: 'COMBAT' as const, gx: 3, gy: 0 },
          { id: 'room_10', type: 'CORE_OVERSEER' as const, gx: 4, gy: 0 },
          { id: 'room_11', type: 'ESCAPE_POD' as const, gx: -1, gy: 0 },
        ];

        for (const cfg of configs) {
          rooms.push(new Room(cfg.id, cfg.type, cfg.gx, cfg.gy, sectorNumber));
        }

        connect(0, 1, 'UP');
        connect(0, 11, 'LEFT');
        connect(0, 2, 'RIGHT');
        connect(0, 5, 'DOWN');
        connect(2, 3, 'RIGHT');
        connect(2, 6, 'DOWN');
        connect(3, 4, 'UP');
        connect(3, 7, 'DOWN');
        connect(3, 9, 'RIGHT');
        connect(5, 6, 'RIGHT');
        connect(6, 7, 'RIGHT');
        connect(7, 8, 'RIGHT');
        connect(8, 9, 'UP');
        connect(9, 10, 'RIGHT');

        // Start Bay
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 400, 320));
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 800, 320));
        rooms[0].lootDrops.push({ x: 550, y: 320, type: 'SCRAP', amount: 15 });
        rooms[0].lootDrops.push({ x: 650, y: 320, type: 'SCRAP', amount: 15 });
        rooms[0].isCleared = true;

        // Workshop
        rooms[1].lootDrops.push({ x: 520, y: 350, type: 'COMPONENT', componentType: 'DYE_VAT_BLUE', amount: 1 });
        rooms[1].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'STACKER', amount: 1 });

        // Combat Rooms
        rooms[2].enemies.push(new Enemy('SCRAP_DRONE', 400, 280), new Enemy('SCRAP_DRONE', 480, 420), new Enemy('LASER_TURRET', 850, 250));
        rooms[3].enemies.push(new Enemy('SCRAP_DRONE', 380, 260), new Enemy('ROLLER_SENTRY', 520, 460), new Enemy('LASER_TURRET', 800, 260));

        // Upper Steam Chimney (Side Cache Room)
        rooms[4].enemies.push(new Enemy('SCRAP_DRONE', 420, 320), new Enemy('SCRAP_DRONE', 680, 320));
        rooms[4].lootDrops.push({ x: 520, y: 350, type: 'SCRAP', amount: 25 });
        rooms[4].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'OVERCLOCKER', amount: 1 });

        rooms[5].enemies.push(new Enemy('SCRAP_DRONE', 400, 260), new Enemy('SCRAP_DRONE', 500, 440), new Enemy('SCRAP_DRONE', 750, 350));
        rooms[6].enemies.push(new Enemy('ROLLER_SENTRY', 480, 260), new Enemy('ROLLER_SENTRY', 520, 460), new Enemy('SCRAP_DRONE', 780, 360));
        rooms[7].enemies.push(new Enemy('LASER_TURRET', 340, 240), new Enemy('ROLLER_SENTRY', 550, 440), new Enemy('SCRAP_DRONE', 760, 260));

        // Elite Guard Post
        const elite1 = new Enemy('LASER_TURRET', 600, 350);
        elite1.isElite = true;
        elite1.maxHp = 140;
        elite1.hp = 140;
        rooms[8].enemies.push(elite1, new Enemy('SCRAP_DRONE', 380, 240), new Enemy('ROLLER_SENTRY', 780, 440));

        // Boss Antechamber
        rooms[9].enemies.push(new Enemy('LASER_TURRET', 350, 220), new Enemy('LASER_TURRET', 860, 480), new Enemy('ROLLER_SENTRY', 600, 350), new Enemy('SCRAP_DRONE', 500, 460));

        // Boss Overseer
        rooms[10].enemies.push(new Enemy('OVERSEER_BOSS', 600, 380));

      } else if (themeSector === 2) {
        // SECTOR 2: HIGH-VOLTAGE POWER GRID (13 Rooms)
        const configs = [
          { id: 'room_0', type: 'START' as const, gx: 0, gy: 2 },
          { id: 'room_1', type: 'COMBAT' as const, gx: 0, gy: 1 },
          { id: 'room_2', type: 'WORKSHOP' as const, gx: 0, gy: 0 },
          { id: 'room_3', type: 'COMBAT' as const, gx: 1, gy: 0 },
          { id: 'room_4', type: 'COMBAT' as const, gx: 1, gy: 1 },
          { id: 'room_5', type: 'COMBAT' as const, gx: 1, gy: 2 },
          { id: 'room_6', type: 'COMBAT' as const, gx: 2, gy: 2 },
          { id: 'room_7', type: 'COMBAT' as const, gx: 2, gy: 1 },
          { id: 'room_8', type: 'COMBAT' as const, gx: 2, gy: 0 },
          { id: 'room_9', type: 'COMBAT' as const, gx: 3, gy: 0 },
          { id: 'room_10', type: 'COMBAT' as const, gx: 3, gy: 1 },
          { id: 'room_11', type: 'CORE_OVERSEER' as const, gx: 3, gy: -1 },
          { id: 'room_12', type: 'ESCAPE_POD' as const, gx: 3, gy: 2 },
        ];

        for (const cfg of configs) {
          rooms.push(new Room(cfg.id, cfg.type, cfg.gx, cfg.gy, sectorNumber));
        }

        connect(0, 1, 'UP');
        connect(0, 5, 'RIGHT');
        connect(1, 2, 'UP');
        connect(1, 4, 'RIGHT');
        connect(2, 3, 'RIGHT');
        connect(3, 4, 'DOWN');
        connect(3, 8, 'RIGHT');
        connect(4, 5, 'DOWN');
        connect(4, 7, 'RIGHT');
        connect(5, 6, 'RIGHT');
        connect(6, 7, 'UP');
        connect(6, 12, 'RIGHT');
        connect(7, 8, 'UP');
        connect(7, 10, 'RIGHT');
        connect(8, 9, 'RIGHT');
        connect(9, 10, 'DOWN');
        connect(9, 11, 'UP');
        connect(10, 12, 'DOWN');

        // Start Bay
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 400, 320));
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 800, 320));
        rooms[0].lootDrops.push({ x: 550, y: 320, type: 'SCRAP', amount: 18 });
        rooms[0].lootDrops.push({ x: 650, y: 320, type: 'SCRAP', amount: 18 });
        rooms[0].isCleared = true;

        // Workshop
        rooms[2].lootDrops.push({ x: 520, y: 350, type: 'COMPONENT', componentType: 'DYE_VAT_YELLOW', amount: 1 });
        rooms[2].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'SPLITTER', amount: 1 });

        // Combat Rooms
        rooms[1].enemies.push(new Enemy('SPARK_DRONE', 420, 270), new Enemy('SPARK_DRONE', 480, 430), new Enemy('TESLA_TURRET', 840, 340));
        rooms[3].enemies.push(new Enemy('SPARK_DRONE', 450, 250), new Enemy('ROLLER_SENTRY', 550, 450), new Enemy('TESLA_TURRET', 800, 260));
        rooms[4].enemies.push(new Enemy('TESLA_TURRET', 350, 240), new Enemy('SPARK_DRONE', 600, 350), new Enemy('ROLLER_SENTRY', 820, 440));
        rooms[5].enemies.push(new Enemy('SPARK_DRONE', 400, 260), new Enemy('SPARK_DRONE', 480, 450), new Enemy('ROLLER_SENTRY', 750, 350));
        rooms[6].enemies.push(new Enemy('ROLLER_SENTRY', 480, 280), new Enemy('ROLLER_SENTRY', 680, 440), new Enemy('TESLA_TURRET', 820, 350));
        rooms[7].enemies.push(new Enemy('TESLA_TURRET', 360, 240), new Enemy('TESLA_TURRET', 840, 460), new Enemy('SPARK_DRONE', 600, 350));
        rooms[8].enemies.push(new Enemy('SPARK_DRONE', 420, 260), new Enemy('SPARK_DRONE', 480, 460), new Enemy('ROLLER_SENTRY', 750, 350));

        // High-Security Pylon Bay
        const eliteTesla = new Enemy('TESLA_TURRET', 600, 350);
        eliteTesla.isElite = true;
        eliteTesla.maxHp = 200;
        eliteTesla.hp = 200;
        rooms[9].enemies.push(eliteTesla, new Enemy('TESLA_TURRET', 350, 230), new Enemy('TESLA_TURRET', 850, 470), new Enemy('SPARK_DRONE', 650, 260));

        // Overlord Antechamber
        const eliteRoll = new Enemy('ROLLER_SENTRY', 600, 350);
        eliteRoll.isElite = true;
        eliteRoll.maxHp = 180;
        eliteRoll.hp = 180;
        rooms[10].enemies.push(eliteRoll, new Enemy('TESLA_TURRET', 350, 240), new Enemy('SPARK_DRONE', 750, 450));

        // Boss Volt Warden
        rooms[11].enemies.push(new Enemy('VOLT_WARDEN', 600, 380));

      } else {
        // SECTOR 3: CYBERNETIC CITADEL (14 Rooms)
        const configs = [
          { id: 'room_0', type: 'START' as const, gx: 0, gy: 2 },
          { id: 'room_1', type: 'COMBAT' as const, gx: 0, gy: 1 },
          { id: 'room_2', type: 'COMBAT' as const, gx: 0, gy: 0 },
          { id: 'room_3', type: 'WORKSHOP' as const, gx: -1, gy: 0 },
          { id: 'room_4', type: 'COMBAT' as const, gx: -1, gy: -1 },
          { id: 'room_5', type: 'COMBAT' as const, gx: 0, gy: -1 },
          { id: 'room_6', type: 'COMBAT' as const, gx: 0, gy: -2 },
          { id: 'room_7', type: 'COMBAT' as const, gx: 1, gy: -2 },
          { id: 'room_8', type: 'COMBAT' as const, gx: 1, gy: -1 },
          { id: 'room_9', type: 'COMBAT' as const, gx: 1, gy: 0 },
          { id: 'room_10', type: 'COMBAT' as const, gx: 1, gy: 1 },
          { id: 'room_11', type: 'COMBAT' as const, gx: 0, gy: -3 },
          { id: 'room_12', type: 'CORE_OVERSEER' as const, gx: 0, gy: -4 },
          { id: 'room_13', type: 'ESCAPE_POD' as const, gx: 2, gy: 0 },
        ];

        for (const cfg of configs) {
          rooms.push(new Room(cfg.id, cfg.type, cfg.gx, cfg.gy, sectorNumber));
        }

        connect(0, 1, 'UP');
        connect(1, 2, 'UP');
        connect(1, 10, 'RIGHT');
        connect(2, 3, 'LEFT');
        connect(2, 5, 'UP');
        connect(2, 9, 'RIGHT');
        connect(3, 4, 'UP');
        connect(4, 5, 'RIGHT');
        connect(5, 6, 'UP');
        connect(5, 8, 'RIGHT');
        connect(6, 7, 'RIGHT');
        connect(6, 11, 'UP');
        connect(7, 8, 'DOWN');
        connect(8, 9, 'DOWN');
        connect(9, 10, 'DOWN');
        connect(9, 13, 'RIGHT');
        connect(11, 12, 'UP');

        // Start Bay
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 400, 320));
        rooms[0].enemies.push(new Enemy('TARGET_DUMMY', 800, 320));
        rooms[0].lootDrops.push({ x: 550, y: 320, type: 'SCRAP', amount: 20 });
        rooms[0].lootDrops.push({ x: 650, y: 320, type: 'SCRAP', amount: 20 });
        rooms[0].isCleared = true;

        // Workshop
        rooms[3].lootDrops.push({ x: 520, y: 350, type: 'COMPONENT', componentType: 'EMITTER_STAR', amount: 1 });
        rooms[3].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'STACKER', amount: 1 });

        // Combat Rooms
        rooms[1].enemies.push(new Enemy('SPARK_DRONE', 380, 260), new Enemy('LASER_TURRET', 840, 260), new Enemy('TESLA_TURRET', 840, 460), new Enemy('ROLLER_SENTRY', 480, 360));
        rooms[2].enemies.push(new Enemy('SPARK_DRONE', 420, 260), new Enemy('SPARK_DRONE', 480, 460), new Enemy('TESLA_TURRET', 820, 350), new Enemy('ROLLER_SENTRY', 600, 360));
        rooms[4].enemies.push(new Enemy('SPARK_DRONE', 400, 250), new Enemy('SPARK_DRONE', 480, 440), new Enemy('ROLLER_SENTRY', 760, 350));
        rooms[5].enemies.push(new Enemy('TESLA_TURRET', 360, 240), new Enemy('LASER_TURRET', 860, 240), new Enemy('ROLLER_SENTRY', 600, 450));
        rooms[6].enemies.push(new Enemy('SPARK_DRONE', 400, 260), new Enemy('SPARK_DRONE', 480, 460), new Enemy('TESLA_TURRET', 820, 350));

        // Cryo Chamber (Side Cache)
        rooms[7].enemies.push(new Enemy('SPARK_DRONE', 450, 320), new Enemy('SPARK_DRONE', 750, 320));
        rooms[7].lootDrops.push({ x: 520, y: 350, type: 'SCRAP', amount: 35 });
        rooms[7].lootDrops.push({ x: 680, y: 350, type: 'COMPONENT', componentType: 'DYE_VAT_PURPLE', amount: 1 });

        rooms[8].enemies.push(new Enemy('ROLLER_SENTRY', 450, 280), new Enemy('ROLLER_SENTRY', 750, 440), new Enemy('SPARK_DRONE', 600, 350));

        // Elite Juggernaut Roller
        const elite3 = new Enemy('ROLLER_SENTRY', 600, 350);
        elite3.isElite = true;
        elite3.maxHp = 260;
        elite3.hp = 260;
        rooms[9].enemies.push(elite3, new Enemy('TESLA_TURRET', 360, 480), new Enemy('LASER_TURRET', 860, 480), new Enemy('SPARK_DRONE', 600, 250));

        rooms[10].enemies.push(new Enemy('ROLLER_SENTRY', 450, 320), new Enemy('ROLLER_SENTRY', 750, 320), new Enemy('SPARK_DRONE', 600, 460));

        // Deep Vault Antechamber with Cyber Enforcer Elite
        const eliteEnforcer = new Enemy('ENFORCER_ELITE', 600, 350);
        rooms[11].enemies.push(eliteEnforcer, new Enemy('TESLA_TURRET', 360, 240), new Enemy('LASER_TURRET', 860, 240), new Enemy('ROLLER_SENTRY', 600, 480));

        // Boss Overlord Core
        rooms[12].enemies.push(new Enemy('OVERLORD_CORE', 600, 380));
      }
    }

    // Hard Mode Enhancements (Extra squads & stats)
    if (gameMode === 'HARD') {
      for (const r of rooms) {
        if (r.type === 'COMBAT') {
          // Add extra reinforcing drone
          if (r.sector === 1) {
            r.enemies.push(new Enemy('SCRAP_DRONE', 520, 240));
          } else {
            r.enemies.push(new Enemy('SPARK_DRONE', 520, 240));
          }
        }
        for (const e of r.enemies) {
          e.applyHardMode();
        }
      }
    }

    // Endless Mode Scaling for loops past Sector 3
    if (sectorNumber > 3) {
      const hpScale = 1 + (sectorNumber - 3) * 0.25;
      for (const r of rooms) {
        for (const e of r.enemies) {
          if (e.type !== 'TARGET_DUMMY') {
            e.maxHp = Math.round(e.maxHp * hpScale);
            e.hp = e.maxHp;
            e.attackCooldown *= 0.82;
          }
        }
      }
    }

    return rooms;
  }

  private static createDoor(room: Room, dir: Direction, targetRoomIndex: number) {
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;

    switch (dir) {
      case 'UP':
        width = 80;
        height = 24;
        x = room.x + room.width / 2 - width / 2;
        y = room.y;
        break;
      case 'DOWN':
        width = 80;
        height = 24;
        x = room.x + room.width / 2 - width / 2;
        y = room.y + room.height - height;
        break;
      case 'LEFT':
        width = 24;
        height = 80;
        x = room.x;
        y = room.y + room.height / 2 - height / 2;
        break;
      case 'RIGHT':
        width = 24;
        height = 80;
        x = room.x + room.width - width;
        y = room.y + room.height / 2 - height / 2;
        break;
    }

    return {
      direction: dir,
      targetRoomIndex,
      isOpen: false,
      x,
      y,
      width,
      height,
    };
  }
}
