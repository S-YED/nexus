const { ethers } = require('ethers');

async function testContract() {
    const provider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/C/rpc');
    const address = '0x3bE24594e9c7d3386AbFa26Ccc6E57e2A8EaAE4e';

    // Test different function selectors
    const tests = [
        { name: 'poolCount()', data: '0xbfc12c05' },
        { name: 'MAX_MEMBERS()', data: '0xea0e35b1' },
        { name: 'COLLATERAL_PERCENT()', data: '0x44e02dbc' },
        { name: 'owner()', data: '0x8da5cb5b' },
        { name: 'deploymentTimestamp()', data: '0xf525cb68' }
    ];

    console.log('Testing deployed contract at:', address);
    console.log('='.repeat(60), '\n');

    for (const test of tests) {
        try {
            const result = await provider.call({
                to: address,
                data: test.data
            });
            const value = ethers.toBigInt(result);
            console.log(test.name.padEnd(30), value.toString());
        } catch (error) {
            console.log(test.name.padEnd(30), 'FAILED');
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\nNow testing if createPool is payable...\n');

    // Check if we can estimate gas for createPool with value
    const createPoolData = '0x8259e6a0' + '0'.repeat(63) + '1'; // createPool(1 wei)

    try {
        const gasEstimate = await provider.estimateGas({
            to: address,
            data: createPoolData,
            value: 0, // Try without value first
            from: '0x0000000000000000000000000000000000000001'
        });
        console.log('createPool(1) without value: Gas =', gasEstimate.toString());
    } catch (error) {
        console.log('createPool(1) without value: REVERTS');
        console.log('Reason:', error.message);
    }
}

testContract().catch(console.error);
