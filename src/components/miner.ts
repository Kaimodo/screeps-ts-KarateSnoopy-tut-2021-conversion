import {log} from '../tools/logger/logger';
import * as M from "../memory";
import * as Builder from "./builder";

/**
 * run: Main Miner Function called by The RoomManager
 * @param room The Room in which the Miner works
 * @param creep The Creep-Object which is running this Function
 * @param rm The RoomMemory-Object
 */
export function run(room: Room, creep: Creep, rm: M.RoomMemory): void {
    const creepMem = M.cm(creep);
    if (creepMem.assignedMineTaskId === undefined) {
        log.info(`${creep.name}: Miner has no Mining Task`);
        const unassignedTasks = _.filter(rm.minerTasks, (t: M.MinerTask) => t.assignedMinerName === undefined);
        log.info('Found unassigned Miner Tasks: '+ unassignedTasks.length)
        if(unassignedTasks.length == 0){
            log.error('No unassigned Tasks found');
        } else {
            unassignedTasks[0].assignedMinerName = creep.name;
            creepMem.assignedMineTaskId = unassignedTasks[0].taskId;
        }
    }else {
        if (creepMem.gathering && creep.store[RESOURCE_ENERGY] === creep.store.getCapacity(RESOURCE_ENERGY)){
            creepMem.gathering = false;
        }
        if (!creepMem.gathering && creep.store[RESOURCE_ENERGY] === 0){
            creepMem.gathering = true;
        }
        // store[RESOURCE_ENERGY] < creep.store.getCapacity()
        // store.getFreeCapacity(RESOURCE_ENERGY) < creep.store.getCapacity()
        if (!creepMem.gathering) {
            // log.info(`${creep.name}: Miner has ${creep.store[RESOURCE_ENERGY]} and is working on dropping off`);
            dropOffEnergy(room, creep);
        } else {
            // const energySource = creep.room.find(FIND_SOURCES_ACTIVE)[0];
            // log.info(`${creep.name}: Miner is moving to Mine`);
            harvestEnergy(creep, creepMem, rm);
        }
    }

}

/**
 * moveToMine at the given Mining Target from the Task in the RoomMemory
 * @param creep The given Creep
 * @param cm The Memory of given Creep
 * @param rm The RoomMemory
 */
function harvestEnergy(creep: Creep, cm: M.CreepMemory, rm: M.RoomMemory): void {
    // log.info(`${creep.name}: Miner is moving to mine`);
    const minerTask = rm.minerTasks.find((t: M.MinerTask) => t.taskId === cm.assignedMineTaskId);
    if (minerTask === undefined) {
        return;
    }
    // log.info(`${creep.name}: Miner got miner Task ${minerTask.taskId}`);
    if (creep.pos.x != minerTask.minerPosition.x ||
        creep.pos.y != minerTask.minerPosition.y){
            // log.info(`${creep.name}: Miner is not in Position at ${minerTask.minerPosition.x},${minerTask.minerPosition.y}`);
            const pos = creep.room.getPositionAt(minerTask.minerPosition.x, minerTask.minerPosition.y);
            if (pos !== null){
                creep.moveTo(pos, {visualizePathStyle: {stroke: '33ff00'} });
            }else{
                log.error(`can't find Pos: ${pos}`);
            }

    } else {
        // log.info(`${creep.name}: Miner is in Position at ${minerTask.minerPosition.x},${minerTask.minerPosition.y}`);
        const sourceId: Id<Source> = minerTask.minerPosition.targetId as Id<Source>;
        const source2 = Game.getObjectById(sourceId) as Source;
        // const source = Game.getObjectById(minerTask.minerPosition.targetId) as Source;
        // const errCode = creep.harvest(source);
        const errCode = creep.harvest(source2);
        if(errCode !== OK && errCode !== ERR_NOT_IN_RANGE && errCode !== ERR_NOT_ENOUGH_RESOURCES){
            log.error(`harvester error: ${errCode}`);
        }
    }
}

/**
 * dropOffEnergy carried
 * @param room The Room in which the Miner is working
 * @param creep The given Creep
 */
function dropOffEnergy(room: Room,creep: Creep): void {
    const targets: Structure[] = creep.room.find(FIND_STRUCTURES, {
        filter: (structure: Structure) => {
            if (structure.structureType === STRUCTURE_EXTENSION){
                const structExt: StructureExtension = structure as StructureExtension;
                return structExt.store[RESOURCE_ENERGY] < structExt.store.getCapacity(RESOURCE_ENERGY);
            }
            if (structure.structureType === STRUCTURE_SPAWN){
                const structSpawn: StructureSpawn = structure as StructureSpawn;
                return structSpawn.store[RESOURCE_ENERGY] < structSpawn.store.getCapacity(RESOURCE_ENERGY);
            }
            if (structure.structureType === STRUCTURE_TOWER){
                const structTower: StructureTower = structure as StructureTower;
                return structTower.store[RESOURCE_ENERGY] < structTower.store.getCapacity(RESOURCE_ENERGY);
            }
            return false
        }
    });
    if (targets.length){
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
            creep.moveTo(targets[0], {visualizePathStyle: {stroke: '0000ff'} });
        }
    } else {
        if (room.controller !== undefined){
            let isBuilding: boolean = false;
            // log.info("RCL-Down: " + room.controller.ticksToDowngrade);
            if (room.controller.ticksToDowngrade > 1000) {
                isBuilding = Builder.buildIfCan(room, creep);
            }
            if (!isBuilding) {
                const status = creep.upgradeController(room.controller);
                if (status === ERR_NOT_IN_RANGE){
                    const moveCode = creep.moveTo(room.controller, {visualizePathStyle: {stroke: '0000ff'} });
                    if (moveCode !== OK && moveCode !== ERR_TIRED){
                        log.error(`rcl: move and got ${moveCode}`);
                    }
                }
            }
        }
    }
}
