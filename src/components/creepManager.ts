import * as Config from "config";
import * as harvester from "./harvester";
import { log } from "../tools/logger/logger";
import * as Profiler from "screeps-profiler";

export let creeps: Creep[];
export let creepCount: number = 0;
export let harvesters: Creep[] = [];

/**
 *
 * @param room The Room in which run is started
 */
export function run(room: Room): void
{

    _loadCreeps(room);

    _buildMissingCreeps(room);

    _.each(creeps, (creep: Creep) =>
    {
        if (creep.memory.role === "harvester")
        {
            harvester.run(creep);
        }
    });
}
Profiler.registerFN(run, 'run(Creep)');

/**
 *
 * @param room The Room in which run is started
 */
function _loadCreeps(room: Room)
{
    creeps = room.find(FIND_MY_CREEPS);
    creepCount = _.size(creeps);
    harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");
}
Profiler.registerFN(_loadCreeps, '_loadCreeps');

/**
 *
 * @param room The Room in which run is started
 */
function _buildMissingCreeps(room: Room)
{
    let bodyParts: BodyPartConstant[]

    const spawns: StructureSpawn[] = room.find(FIND_MY_SPAWNS, {
        filter: (spawn: StructureSpawn) =>
        {
            return spawn.spawning === null;
        },
    });

    if (harvesters.length < 2)
    {
        if (harvesters.length < 1 || room.energyCapacityAvailable <= 800)
        {
            bodyParts = [WORK, WORK, CARRY, MOVE];
        } else if (room.energyCapacityAvailable > 800)
        {
            bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }

        _.each(spawns, (spawn: StructureSpawn) =>
        {
            _spawnCreep(spawn, bodyParts, "harvester");
        });
    }
}
Profiler.registerFN(_buildMissingCreeps, '_buildMissingCreeps');

/**
 *
 * @param spawn The specific Spawn
 * @param bodyParts The BodyParts with which the Creep should be Spawned
 * @param role The Role of the Spawning Creep
 * @returns The Status Msg from the Spawn
 */
function _spawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: string)
{
    const uuid: number = Memory.uuid;
    // let status2: number | string = spawn.canCreateCreep(bodyParts, undefined);
    let status: number | string = spawn.spawnCreep(bodyParts, 'status' , {dryRun: true});
    let properties: any/*{ [key: string]: any }*/ = {
        role,
        room: spawn.room.name,
    };

    status = _.isString(status) ? OK : status;
    if (status === OK)
    {
        Memory.uuid = uuid + 1;
        let creepName: string = spawn.room.name + " - " + role + uuid;

        log.info("Started creating new creep: " + creepName);
        if (Config.ENABLE_DEBUG_MODE)
        {
            log.info("Body: " + bodyParts);
        }
        //log.debug('BuildingStringProps: ' + JSON.stringify(properties));

        //status = spawn.spawnCreep(bodyParts, creepName, properties);
        status = spawn.createCreep(bodyParts, creepName, properties);

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
