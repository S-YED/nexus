const { ethers } = require('ethers');

async function getPoolIdFromTransaction() {
    const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/C/rpc');

    const txHash = '0x439ac18a58f4fef826c4ff015e1180a5df2e1fb18a40f22ba971ae1d76bb09b6';

    console.log('Fetching transaction receipt...\n');
    const receipt = await provider.getTransactionReceipt(txHash);

    // PoolCreated event signature
    const poolCreatedTopic = ethers.id('PoolCreated(uint256,address,uint256,uint256)');

    console.log('Looking for PoolCreated event...\n');

    for (const log of receipt.logs) {
        if (log.topics[0] === poolCreatedTopic) {
            const poolId = ethers.toBigInt(log.topics[1]);
            const creator = ethers.getAddress('0x' + log.topics[2].slice(26));

            console.log('✅ POOL CREATED!');
            console.log('='.repeat(50));
            console.log('Pool ID:', poolId.toString());
            console.log('Creator:', creator);
            console.log('='.repeat(50));
            console.log('\n🎯 Use Pool ID:', poolId.toString(), 'to join from another wallet\n');
            return poolId.toString();
        }
    }

    console.log('❌ No PoolCreated event found in transaction');
}

getPoolIdFromTransaction().catch(console.error);
