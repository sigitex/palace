declare type PathOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${PathOf<ObjectType[Key]>}`
    : `${Key}`
}[keyof ObjectType & (string | number)]

declare type MaybePromise<T> = T | Promise<T>

declare module "@phosphor-icons/web/duotone"
