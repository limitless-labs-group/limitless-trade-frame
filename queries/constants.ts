import {base, baseSepolia} from "viem/chains";

export const defaultChain = process.env.NEXT_PUBLIC_NETWORK === 'testnet' ? baseSepolia : base

export const newSubgraphURI = {
    [base.id]: 'https://indexer.bigdevenergy.link/bd7abc0/v1/graphql',
    [baseSepolia.id]: 'https://indexer.bigdevenergy.link/24f533c/v1/graphql',
}