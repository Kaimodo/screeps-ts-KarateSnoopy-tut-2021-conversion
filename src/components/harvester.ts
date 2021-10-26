import * as Logger from '../tools/logger/logger';

/**
 *
 * @param creep The Creep-Object which is running this Function
 */
export function run(creep: Creep): void
{
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
    const energySource = creep.room.find(FIND_SOURCES_ACTIVE)[0];

    if (creep.store.getFreeCapacity() < creep.store.getCapacity())
    {
        _moveToDropEnergy(creep, spawn);
    } else
    {
        _moveToHarvest(creep, energySource);
    }
}

/**
 *
 * @param creep The Creep-Object which is running this Function
 * @param target The Target of the Creep
 * @returns Err Code
 */
function _tryHarvest(creep: Creep, target: Source): number
{
    return creep.harvest(target);
}

/**
 *
 * @param creep The Creep-Object which is running this Function
 * @param target The target of the given Creep
 */
function _moveToHarvest(creep: Creep, target: Source): void
{
    if (_tryHarvest(creep, target) === ERR_NOT_IN_RANGE)
    {
        creep.moveTo(target.pos, {visualizePathStyle: {stroke: '#99ff00'}});
    }
}

/**
 *
 * @param creep The Creep-Object which is running this Function
 * @param target The Target of the given creep
 * @returns status
 */
function _tryEnergyDropOff(creep: Creep, target: StructureSpawn | Structure): number
{
    return creep.transfer(target, RESOURCE_ENERGY);
}

/**
 *
 * @param creep The Creep-Object which is running this Function
 * @param target THe target of the given creep
 */
function _moveToDropEnergy(creep: Creep, target: StructureSpawn | Structure): void
{
    if (_tryEnergyDropOff(creep, target) === ERR_NOT_IN_RANGE)
    {
        creep.moveTo(target.pos, {visualizePathStyle: {stroke: '#99ff00'}});
    }
}
