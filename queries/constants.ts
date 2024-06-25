import {base, baseSepolia} from "viem/chains";

export const defaultChain = process.env.NEXT_PUBLIC_CHAIN_TYPE === 'testnet' ? baseSepolia : base