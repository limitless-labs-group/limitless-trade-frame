import {createPublicClient, http} from "viem";
import {defaultChain} from "@/queries/constants";


export function getViemClient() {
    const client = createPublicClient({
        transport: http(),
        chain: defaultChain,
    });

    return client;
}