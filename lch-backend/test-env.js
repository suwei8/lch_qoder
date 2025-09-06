// 环境变量测试脚本
require('dotenv').config({ path: '.env' });

console.log('环境变量测试结果:');
console.log('===================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('DATABASE_PORT:', process.env.DATABASE_PORT);
console.log('DATABASE_USERNAME:', process.env.DATABASE_USERNAME);
console.log('DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '***已设置***' : '未设置');
console.log('DATABASE_NAME:', process.env.DATABASE_NAME);
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***已设置***' : '未设置');
console.log('===================');

// 测试数据库连接（使用环境变量）
const mysql = require('mysql2/promise');

async function testDbConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT),
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME
        });
        
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ 数据库连接成功 (使用环境变量)');
        await connection.end();
    } catch (error) {
        console.log('❌ 数据库连接失败:', error.message);
    }
}

testDbConnection();