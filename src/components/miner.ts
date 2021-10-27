import * as Logger from '../tools/logger/logger';

/**
 * run
 * @param creep The Creep-Object which is running this Function
 */
export function run(creep: Creep): void {
    if (creep.store.getFreeCapacity() < creep.store.getCapacity()) {
        dropOffEnergy(creep);
    } else {
        const energySource = creep.room.find(FIND_SOURCES_ACTIVE)[0];
        moveToMine(creep, energySource);
    }
}

/**
 * moveToHarvest
 * @param creep The given Creep
 * @param target The target of given Given Creep
 */
function moveToMine(creep: Creep, target: Source): void {
    if (creep.harvest(target)=== ERR_NOT_IN_RANGE){
        creep.moveTo(target.pos);
    }
}

/**
 * dropOffEnergy
 * @param creep The given Creep
 */
function dropOffEnergy(creep: Creep): void {
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
            creep.moveTo(targets[0], {visualizePathStyle: {stroke: '00ff00'} });
        }
    }
}
