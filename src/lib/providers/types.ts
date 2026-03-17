export interface ImageProvider {
    readonly name: string;
    next(): Promise<string | null>;
}
