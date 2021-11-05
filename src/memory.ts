// Memory and other Things
export let MemoryVersion = 11;

export function setMemVersion(value: number): void {
    MemoryVersion = value;
  }

  export function getMemVersion(): number {
    return MemoryVersion;
  }

export const enum CreepRoles {
    ROLE_UNASSINGED = 0,
    ROLE_ALL,
    ROLE_BUILDER,
    ROLE_MINER,
    ROLE_MINERHAULER,
    ROLE_HEALER,
    ROLE_FIGHTER,
    ROLE_RANGER,
    ROLE_CLAIMER,
    ROLE_REMOTEMINER,
    ROLE_REMOTEHAULER,
    ROLE_CUSTOMCONTROL,
    ROLE_UPGRADER,
    ROLE_UPGRADETRANSPORT
}

/**
 *
 * @param job The Role the Creep is assigned
 * @returns The Role as String
 */
export function roleToString(job: CreepRoles): string {
    switch(job){
        case CreepRoles.ROLE_BUILDER: return 'ROLE_BUILDER';
        case CreepRoles.ROLE_MINER: return 'ROLE_MINER';
        case CreepRoles.ROLE_MINERHAULER: return 'ROLE_MINERHAULER';
        case CreepRoles.ROLE_HEALER: return 'ROLE_HEALER';
        case CreepRoles.ROLE_FIGHTER: return 'ROLE_FIGHTER';
        case CreepRoles.ROLE_RANGER: return 'ROLE_RANGER';
        case CreepRoles.ROLE_CLAIMER: return 'ROLE_CLAIMER';
        case CreepRoles.ROLE_REMOTEMINER: return 'ROLE_REMOTEMINER';
        case CreepRoles.ROLE_ALL: return 'ROLE_ALL';
        case CreepRoles.ROLE_CUSTOMCONTROL: return 'ROLE_CUSTOMCONTROL';
        case CreepRoles.ROLE_UPGRADER: return 'ROLE_UPGRADER';
        case CreepRoles.ROLE_UPGRADETRANSPORT: return 'ROLE_UPGRADETRANSPORT';
        case CreepRoles.ROLE_UNASSINGED: return 'ROLE_UNASSINGED';
        case CreepRoles.ROLE_MINERHAULER: return 'ROLE_MINERHAULER';
        default: return 'unknown Role';
    }
}

export interface MyPosition{
    x: number;
    y: number;
}

export interface PositionPlusTarget{
    x: number;
    y: number;
    targetId: string;
}

export interface RoomPositionPlusTarget{
    roomTarget: string;
    x: number;
    y: number;
    targetId: string;
}

export interface MinerTask {
    taskId: number;
    minerPosition: PositionPlusTarget;
    assignedMinerName?: string;
    sourceContainer: PositionPlusTarget | undefined;
}

export class RoomMemory {
    public roomName: string;
    public minerTasks!: MinerTask[];
    public desiredBuilders!: number;
    public energySources!: PositionPlusTarget[];
    public containerPositions!: PositionPlusTarget[];

    public constructor(room: Room){
        this.roomName = room.name;
    }
}

export interface NodeChoice
{
    x: number;
    y: number;
    dist: number;
}
export interface GameMemory {
    memVersion: number | undefined;
    uuid: number;
    log: any;
    creeps: {
        [name: string]: any;
    };
    powerCreeps: {
        [name: string]: PowerCreepMemory
    };
    flags: {
        [name: string]: any;
    };
    rooms: {
        [name: string]: RoomMemory;
    };
    spawns: {
        [name: string]: any;
    }
}

export interface CreepMemory {
    role: CreepRoles;
    roleString: string;
    log: boolean;
    assignedMineTaskId?: number;
    gathering: boolean;
}

/**
 * Cast? CreepMemory
 * @param creep The given Creep
 * @returns CreepMemory
 */
export function cm(creep: Creep): CreepMemory{
    return creep.memory as CreepMemory;
}

/**
 * Cast? gameMemory. for better understanding i called it gm instead of m only.
 * @param creep The given Creep
 * @returns GameMemory
 */
 export function gm(): GameMemory{
    return Memory as any as GameMemory;
}
