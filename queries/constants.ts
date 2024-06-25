import {base, baseSepolia} from "viem/chains";

export const defaultChain = process.env.CHAIN_TYPE === 'testnet' ? baseSepolia : base