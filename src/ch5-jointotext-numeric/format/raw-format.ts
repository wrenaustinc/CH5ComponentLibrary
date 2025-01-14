import { NumericFormat } from "./numeric-format";

export type RawFormatOptions = {}

export class RawFormat extends NumericFormat {

    public format(value: number, options: RawFormatOptions) {
        // raw integer - e.g. "%r" -- used for a raw integer
        if (isNaN(value)){
            return "0";
       }
       value = Math.abs(value);
       value = value > 65535 ? 65535 : value;
        return value.toString();
    }

}