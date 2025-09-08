// 数据库连接测试脚本
const mysql = require('mysql2/promise');
const Redis = require('ioredis');

async function testConnections() {
    console.log('============================================');
    console.log('     洗车IOT管理系统 - 连接测试脚本');
    console.log('============================================\n');

    let mysqlConnection = null;
    let redisConnection = null;

    try {
        // 测试MySQL连接
        console.log('[1/2] 测试MySQL连接...');
        mysqlConnection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: 'cCNyGNDDD5Mp6d9f',
            connectTimeout: 5000
        });

        const [rows] = await mysqlConnection.execute('SELECT VERSION() as version');
        console.log('✅ MySQL连接成功');
        console.log(`   版本: ${rows[0].version}`);

        // 检查数据库是否存在
        try {
            await mysqlConnection.execute('USE lch_v4');
            const [tables] = await mysqlConnection.execute(
                'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema=?',
                ['lch_v4']
            );
            console.log(`   数据库lch_v4存在，包含 ${tables[0].count} 张表`);
        } catch (error) {
            console.log('⚠️  数据库lch_v4不存在，需要初始化');
        }

    } catch (error) {
        console.log('❌ MySQL连接失败:');
        console.log(`   错误: ${error.message}`);
        console.log('   请检查:');
        console.log('   1. MySQL服务是否启动');
        console.log('   2. 用户名密码是否正确: root/cCNyGNDDD5Mp6d9f');
        console.log('   3. 端口3306是否可访问');
    }

    try {
        // 测试Redis连接
        console.log('\n[2/2] 测试Redis连接...');
        redisConnection = new Redis({
            host: '127.0.0.1',
            port: 6379,
            connectTimeout: 5000,
            lazyConnect: true
        });

        await redisConnection.connect();
        const pong = await redisConnection.ping();
        
        if (pong === 'PONG') {
            console.log('✅ Redis连接成功');
            
            // 测试基本操作
            await redisConnection.set('test_key', 'test_value');
            const value = await redisConnection.get('test_key');
            await redisConnection.del('test_key');
            
            if (value === 'test_value') {
                console.log('   读写测试通过');
            }
        }

    } catch (error) {
        console.log('❌ Redis连接失败:');
        console.log(`   错误: ${error.message}`);
        console.log('   请检查:');
        console.log('   1. Redis服务是否启动');
        console.log('   2. 端口6379是否可访问');
        console.log('   3. 如使用WSL2: wsl redis-server');
    }

    // 清理连接
    if (mysqlConnection) {
        await mysqlConnection.end();
    }
    if (redisConnection) {
        redisConnection.disconnect();
    }

    console.log('\n============================================');
    console.log('              测试完成');
    console.log('============================================');
}

// 检查依赖
try {
    require('mysql2/promise');
    require('ioredis');
    testConnections().catch(console.error);
} catch (error) {
    console.log('❌ 缺少必需的依赖包:');
    console.log('请在后端目录安装依赖: cd lch-backend && npm install');
}