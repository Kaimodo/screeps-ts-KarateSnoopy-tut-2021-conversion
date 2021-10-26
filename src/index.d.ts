// Game Memory
interface Memory {
    uuid: number;
    log: any;
}

// CreepMemory
interface CreepMemory {
    role: string;
    room: string;
    working?: boolean;
}

// FlagMemory
interface FlagMemory { [name: string]: any }

// SpawnMemory
interface SpawnMemory { [name: string]: any }
// RoomMemory
interface RoomMemory {
    [name: string]: any;
}



// Syntax for adding proprties to `global` (ex "global.log")
declare namespace NodeJS {
    interface Global {
        cc: any;
        Profiler: any;
        log: {
            level: number,
            showSource: boolean,
            showTick: boolean
        };
    }
}
