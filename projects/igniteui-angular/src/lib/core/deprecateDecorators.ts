export function DeprecateClass(message: string): ClassDecorator {
    return (constructor: any) => {
        console.warn(constructor.name + ': ' + message);
    };
}

export function DeprecateMethod(message: string): MethodDecorator {
    return (constructor: any, key: string, descriptor: any) => {
        console.warn((constructor.name ? constructor.name : constructor.constructor.name) + ': ' + message);
    };
}

export function DeprecateProperty(message: string): PropertyDecorator {
    return (constructor: any) => {
        console.warn(constructor.constructor.name + ': ' + message);
    };
}
