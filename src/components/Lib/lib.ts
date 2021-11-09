import * as Inscribe from "screeps-inscribe";
import * as Config from "config";
import {log} from '../../tools/logger/logger';
import {ENABLE_DEBUG_MODE} from "config";
import * as M from "memory";
// import * as RoomManager from "../roomManager";

/**
 * Spawn the Creeps if necessary
 * @export spawnCreep
 * @param {StructureSpawn} spawn The specific Spawn
 * @param {BodyPartConstant[]} bodyParts The BodyParts with which the Creep should be Spawned
 * @param {M.CreepRoles} role The Role of the Spawning Creep
 * @return {*}  {number} The Status Msg from the Spawn as Number
 */
export function spawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: M.CreepRoles, rm: M.RoomMemory): number
 {
     const uuid: number = M.gm().uuid
     let status: number | string = spawn.spawnCreep(bodyParts, 'status' , {dryRun: true});

     status = _.isString(status) ? OK : status;
     if (status === OK)
     {
        const creepName: string = spawn.room.name + " - " + M.roleToString(role) + "-" + uuid;
        M.gm().uuid = uuid + 1;
        let properties: any = {
            memory: {
                name: creepName,
                log: false,
                role: role,
                roleString: M.roleToString(role),
                gathering: true,
                isUpgradingController: false,
            }
        }

        // let splitName: string = properties.memory.roleString;
        // const [prefix, roleName] = splitName.split('_');
        // let creepName: string = spawn.room.name + "-" + roleName + "-"+ uuid;

        log.info("Started creating new creep: " + creepName);
        if (Config.ENABLE_DEBUG_MODE)
        {
            log.info("Body: " + bodyParts);
            log.info("Memory: " + JSON.stringify(properties));
        }

        status = spawn.spawnCreep(bodyParts, creepName, properties as SpawnOptions);

        rm.spawnText = `🛠️ ${M.roleToString(role)}`;
        rm.spawnTextId = spawn.id;

        return _.isString(status) ? OK : status;
     } else
     {
         if (Config.ENABLE_DEBUG_MODE && status !== ERR_NOT_ENOUGH_ENERGY)
         {
             log.info("Failed creating new creep: " + status);
         }

         return status;
     }
 }

/**
 *
 * Try to Spawn the Creep with the given properties
 * @export tryToSpawnCreep
 * @param {StructureSpawn[]} inactiveSpawns The SPawn which should spawn
 * @param {BodyPartConstant[]} bodyParts The Parts of the Creep
 * @param {M.CreepRoles} role The Role that the creep will follow
 */
export function tryToSpawnCreep(inactiveSpawns: StructureSpawn[], bodyParts: BodyPartConstant[], role: M.CreepRoles, rm: M.RoomMemory){
    let spawned: boolean = false;
    _.each(inactiveSpawns, (spawn: StructureSpawn) =>
    {
        if(!spawned){
            const status = spawnCreep(spawn, bodyParts, role, rm);
            if (status === OK) {
                spawned = true;
            }
        }
    });
}

/**
 *
 * Get the optimal position to build Extension
 * @param {Room} room The Room in which to build
 * @param {M.RoomMemory} rm The Memory of the Room
 * @param {RoomPosition[]} extPositions The beginning position
 * @return {*}  {(RoomPosition | null)} A Position (x,y)
 */
function getOptimalExtensionPosition(room: Room, rm: M.RoomMemory, extPositions: RoomPosition[]): RoomPosition | null{
  const sources = room.find(FIND_SOURCES);
  const firstSpawn = getFirstSpawn(room);
  if (firstSpawn == null){
      return null;
  }
  const maxRange = 10;
  const choices: M.NodeChoice[] = [];
  log.info(`finding optimal extension pos`);
  for (let x = firstSpawn.pos.x - maxRange; x < firstSpawn.pos.x + maxRange; x++){
    for (let y = firstSpawn.pos.y - maxRange; y < firstSpawn.pos.y + maxRange; y++){
      const searchRoomPos: RoomPosition | null = room.getPositionAt(x, y);
      if (searchRoomPos !== null){
        const found: string = searchRoomPos.lookFor(LOOK_TERRAIN) as any;
        if (found != "wall") {
          let tooClose = false;
            for (const extensionPos of extPositions){
              const rangeToExt = extensionPos.getRangeTo(x, y);
                if (rangeToExt <= 1){
                  tooClose = true;
                    break;
                }
            }
            if (tooClose){
              continue;
            }
            let range = 0;
            _.each(sources, (source: Source) => {
              const rangeToSource = source.pos.getRangeTo(x, y);
                if (rangeToSource <= 3) {
                  tooClose = true;
                }
                range += rangeToSource;
            });
        if (tooClose){
          continue;
        }
        const rangeToSpawn = firstSpawn.pos.getRangeTo(x, y);
            range += rangeToSpawn;
            if (rangeToSpawn <= 2) {
              continue;
            }
            const choice: M.NodeChoice = {
              x, y, dist: range
            };
        choices.push(choice);
        }
      }
    }
  }
  const sortedChoices = _.sortBy(choices, (choice: M.NodeChoice) => choice.dist);
  if (sortedChoices.length > 0) {
    log.info(`Best choice is ${sortedChoices[0].x}, ${sortedChoices[0].y} == ${sortedChoices[0].dist}`);
    const roomPos: RoomPosition | null = room.getPositionAt(sortedChoices[0].x, sortedChoices[0].y);
    return roomPos;
  }
  return null;
}

/**
 *
 * Try to build a Extension
 * @export buildExtension
 * @param {M.RoomMemory} rm The Room Memory
 * @param {Room} room The Room in which to build
 * @param {number} Number of Extensions to build
 * @return {*}
 */
export function buildExtension(rm: M.RoomMemory, room: Room, numExtensionToBuild: number){

    const extensions = room.find(FIND_STRUCTURES, { filter: (structure: Structure) => (structure.structureType === STRUCTURE_EXTENSION) });
    const extConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, { filter: (structure: ConstructionSite) => (structure.structureType === STRUCTURE_EXTENSION) });
    const numExtensionsBuilt = extensions.length + extConstructionSites.length;
    const numExtensionsNeeded = numExtensionToBuild - numExtensionsBuilt;

    log.info(`[${Inscribe.color(`numExtensionToBuild=${numExtensionToBuild} numExtensionsBuilt=${numExtensionsBuilt} numExtensionsNeeded=${numExtensionsNeeded}`, "#5CC9DF")}]`)

    if (numExtensionsNeeded > 0){
        const extPos: RoomPosition[] = [];
        _.each(extensions, (extension: StructureExtension) => extPos.push(extension.pos));
        _.each(extConstructionSites, (extension: ConstructionSite) => extPos.push(extension.pos));

        log.info(`numExtensionsNeeded=${numExtensionsNeeded}`);
        const roomPos: RoomPosition | null = getOptimalExtensionPosition(room, rm, extPos);
        if (roomPos != null){
            const errCode = room.createConstructionSite(roomPos, STRUCTURE_EXTENSION);
            if (errCode === OK){
                log.info(`Created extension at ${roomPos}`);
                return;
            } else {
                log.info(`ERROR: created extension at ${roomPos} ${errCode}`);
            }
        } else {
            log.info(`ERROR: coudln't create more extensions`);
        }
    }
}


/**
 * Get the Optimal Position to build Container. (Between Source and SPawn)
 * @param {M.MinerTask[]} minerTasksForSource The Miner Tasks for the given Source
 * @param {M.PositionPlusTarget} sourcePos The Position of the Source
 * @param {Room} room The Room where the sources are
 * @return {*}  {(M.PositionPlusTarget | null)} The Optimal Position (x,y)
 */
function getOptimalContainerPosition(minerTasksForSource: M.MinerTask[], sourcePos: M.PositionPlusTarget, room: Room): M.PositionPlusTarget | null{
    const roomPos: RoomPosition | null = room.getPositionAt(sourcePos.x, sourcePos.y);
    if (roomPos === null){
      return null;
    }

    const firstSpawn = getFirstSpawn(room);
    if(firstSpawn === null){
        return null;
    }

    const choices: M.NodeChoice[] = [];
    log.info(`finding optimal container pos for ${sourcePos.x}, ${sourcePos.y}`);
    for (let x = sourcePos.x - 2; x <= sourcePos.x + 2; x++) {
      for (let y = sourcePos.y - 2; y <= sourcePos.y + 2; y++) {
        const range = roomPos.getRangeTo(x, y);
        if (range === 2) {
          const searchPos: RoomPosition | null = room.getPositionAt(x, y);
          if (searchPos !== null) {
            const found: string = roomPos.lookFor(LOOK_TERRAIN) as any;
            if (found !== "wall")  {
              if(ENABLE_DEBUG_MODE) log.debug(`${x}, ${y} == ${range} is not wall`);
              if(ENABLE_DEBUG_MODE) log.debug("Container-Pos: " + searchPos.x + "," + searchPos.y + "=" + found);

              let dist = _.sum(minerTasksForSource, (task: M.MinerTask) => {
                const taskPos: RoomPosition | null = room.getPositionAt(task.minerPosition.x, task.minerPosition.y);
                if (taskPos === null) {
                    return 0;
                } else {
                    return taskPos.getRangeTo(x, y);
                }
              });
              // log.info(`${x}, ${y} == ${dist} total`);
              dist += firstSpawn.pos.getRangeTo(x, y);
              log.info(`${x}, ${y} == ${dist} total dist including to spawn`);

              const choice: M.NodeChoice = {
                      x, y, dist
              };
              choices.push(choice);
            }
          }
        }
      }
    }

    const sortedChoices = _.sortBy(choices, (choice: M.NodeChoice) => choice.dist);
    if (sortedChoices.length > 0) {
      log.info(`Cont: Best choice is ${sortedChoices[0].x}, ${sortedChoices[0].y} == ${sortedChoices[0].dist}`);
      const containerPos: M.PositionPlusTarget = {
          targetId: sourcePos.targetId,
          x: sortedChoices[0].x,
          y: sortedChoices[0].y
      };
      if(ENABLE_DEBUG_MODE) log.debug("ContPos: " + JSON.stringify(containerPos));
      return containerPos;
    }

    return null;
  }

/**
 *
 * Get ID of Container with least Builders assigned
 * @export getContainerIdWithLeastBuildersAssigned
 * @param {Room} room The Room in which the Container is
 * @param {M.RoomMemory} rm The Memory of the RoomMemory
 * @return {*}  {(string | undefined)}  The ID of the Container
 */
export function getContainerIdWithLeastBuildersAssigned(room: Room, rm: M.RoomMemory): string | undefined {
    const choices: M.NodeContainerIdChoice[] = [];
    let LibStruct =  room.find<StructureContainer>(FIND_STRUCTURES);
    let LibCont = _.filter(LibStruct, (structure) => structure.structureType === STRUCTURE_CONTAINER) as StructureContainer[];

    _.each(LibCont, (container: StructureContainer) => {

        let count = 0;
        const creeps: Creep[] = room.find(FIND_MY_CREEPS);
        const builders = _.filter(creeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_BUILDER);
        _.each(builders, (tmpBuilder: Creep) => {
            if(M.cm(tmpBuilder).assignedContainerId === container.id) {
                count++;
            }
        });
        const choice: M.NodeContainerIdChoice = {
            id: container.id, count
        };
        log.info(`Container ${container.id} = ${count}`);
        choices.push(choice);
    });

    const sortedChoices = _.sortBy(choices, (choice: M.NodeContainerIdChoice) => choice.count);
    if(sortedChoices.length > 0) {
        log.info(`Best container ${sortedChoices[0].id} = ${sortedChoices[0].count}`);
        return sortedChoices[0].id;
    }

    return undefined
}

/**
 * Initiate the Room. and get Energy-Mining-Positions from SOurces
 * @export InitRoomMemory
 * @param {Room} room The given Room
 * @param {string} roomName The Name of the Room
 */
export function InitRoomMemory(room: Room, roomName: string) {
    const rm: M.RoomMemory = M.gm().rooms[roomName];
    rm.roomName = roomName;
    rm.minerTasks = [];
    rm.energySources = [];
    rm.containerPositions = [];
    rm.extensionIdsAssigned = [];
    rm.desiredBuilders = Config.MAX_BUILDERS;
    rm.techLevel = 0;

    let taskIdNum = 0;

    const sources = room.find(FIND_SOURCES_ACTIVE);
    for (const sourceName in sources) {
      const source: Source = sources[sourceName] as Source;
      const sourcePos: M.PositionPlusTarget = {
        targetId: source.id,
        x: source.pos.x,
        y: source.pos.y
      };
      rm.energySources.push(sourcePos);

      const positions = [
        [source.pos.x - 1, source.pos.y - 1],
        [source.pos.x - 1, source.pos.y + 0],
        [source.pos.x - 1, source.pos.y + 1],

        [source.pos.x + 1, source.pos.y - 1],
        [source.pos.x + 1, source.pos.y + 0],
        [source.pos.x + 1, source.pos.y + 1],

        [source.pos.x + 0, source.pos.y - 1],
        [source.pos.x + 0, source.pos.y + 1]
      ];
      const minerTasksForSource: M.MinerTask[] = [];
      for (const pos of positions ){
        const roomPos: RoomPosition | null = room.getPositionAt(pos[0] , pos[1]);
        if (roomPos !== null){
          const found: Terrain[] = roomPos.lookFor(LOOK_TERRAIN) as Terrain[];
          if (found.toString() != "wall") {
            if(Config.ENABLE_DEBUG_MODE){
              log.debug("MinerTask-Pos: " + pos[0] + "," + pos[1] + "=" + found);
            }
            const minerPos: M.PositionPlusTarget ={
                    targetId: source.id,
                    x: pos[0],
                    y: pos[1]
            };
            taskIdNum++;
            const minerTask: M.MinerTask = {
                    minerPosition: minerPos,
                    taskId: taskIdNum,
                    sourceContainer: undefined
            };

            rm.minerTasks.push(minerTask);
            minerTasksForSource.push(minerTask);
          }
        }
      }
      const containerPos =getOptimalContainerPosition(minerTasksForSource, sourcePos, room);
      log.debug("InitRoomMemory|containerPos: " + JSON.stringify(containerPos));
      if (containerPos !== null){
          rm.containerPositions.push(containerPos);
      }
    }
  }

/**
 * Get the  Energy avaiable in the Romm
 * @export getRoomEnergyLevel
 * @param {M.RoomMemory} rm The Romm Memory
 * @param {Room} room The Room
 * @return {*}  {number} The Level as number
 */
export function getRoomEnergyLevel(rm: M.RoomMemory, room: Room): number {
  // switch (room.controller.level)
  // {
  //     case 1: numExtensionToBuild = 0; break; // 300
  //     case 2: numExtensionToBuild = 5; break; // 550
  //     case 3: numExtensionToBuild = 10; break; // 800
  //     case 4: numExtensionToBuild = 20; break; // 1300
  //     case 5: numExtensionToBuild = 30; break;
  //     case 6: numExtensionToBuild = 40; break;
  //     case 7: numExtensionToBuild = 50; break;
  //     case 8: numExtensionToBuild = 60; break;
  // }

  if (rm.techLevel <= 4 && room.energyAvailable < 550) {
    return 1;
  }
  else if (room.energyCapacityAvailable < 800) {
    return 2;
  } else {
    return 3;
  }
}

/**
 * Remove assigned ExtId
 * @export removeAssignedExt
 * @param {string} targetId The Id of the Extension
 * @param {M.RoomMemory} rm The Room Memory
 */
export function removeAssignedExt(targetId: string, rm: M.RoomMemory) {
  _.remove(rm.extensionIdsAssigned, (ext: string) => ext === targetId);
}

/**
 *
 * Get the First Spawn
 * @export getFirstSpawn
 * @param {Room} room The Room
 * @return {*}  {(StructureSpawn | null)}
 */
export function getFirstSpawn(room: Room): StructureSpawn | null{
    const spawns: StructureSpawn[] = room.find(FIND_MY_SPAWNS);
    if (spawns.length === 0){
        return null;
    }
    return spawns[0] as StructureSpawn;
}
/**
 *
 * Check if Assigned Tasks have no Miner
 * @export cleanupAssignedMiners
 * @param {M.RoomMemory} rm The RoomMemory
 */
export function cleanupAssignedMiners(rm: M.RoomMemory){
    for (const task of rm.minerTasks){
        if(task.assignedMinerName !== undefined){
            const creep = Game.creeps[task.assignedMinerName];
            if(creep as any === undefined){
                log.info(`[${Inscribe.color(`Clearing mining task assigned to ${task.assignedMinerName}`, "red")}]`);
                task.assignedMinerName = undefined;
            } else if(M.cm(creep).role !== M.CreepRoles.ROLE_MINER){
                task.assignedMinerName = undefined;
                // log.info(`Clearing mining task assigned to ${task.assignedMinerName}`);
                log.info(`[${Inscribe.color(`Clearing mining task assigned to ${task.assignedMinerName}`, "red")}]`);
            }
        }
    }
}

/**
 * Get the Tech Level of the actual Room
 * @export getTechLevel
 * @param {Room} room The Room
 * @param {M.RoomMemory} rm The Memory of the Room
 * @param {number} The Number of Extensions
 * @return {*}  {number} The Tech Level
 */
export function getTechLevel(room: Room, rm: M.RoomMemory, numExtensionToBuild: number): number{
    // Tech level 1 = building miners
    // Tech level 2 = building containers
    // Tech level 3 = building builders
    // Tech level 4 = building extensions
    // Tech Level 5 = ?
    let extensions = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }) as StructureExtension[];
    let TLCreeps = room.find(FIND_MY_CREEPS);
    let TLBuilders = _.filter(TLCreeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_BUILDER);
    let TLMiners = _.filter(TLCreeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_MINER);

    let TLStruct =  room.find<StructureContainer>(FIND_STRUCTURES);
    let TLContainers = _.filter(TLStruct, (structure) => structure.structureType === STRUCTURE_CONTAINER) as StructureContainer[];


    if (TLMiners.length < rm.minerTasks.length - 2){
      return 1;
    }

    if (TLContainers.length !== rm.energySources.length){
      return 2;
    }

    if (TLBuilders.length < rm.desiredBuilders - 2){
      return 3;
    }

    if (extensions.length < numExtensionToBuild){
        return 4;
    }

    return 5;
}
