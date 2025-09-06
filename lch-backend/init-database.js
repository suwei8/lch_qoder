// 数据库初始化脚本
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDatabase() {
    console.log('============================================');
    console.log('      洗车IOT管理系统 - 数据库初始化');
    console.log('============================================\n');

    let connection = null;

    try {
        // 创建数据库连接
        console.log('正在连接数据库...');
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: 'cCNyGNDDD5Mp6d9f',
            multipleStatements: true
        });

        // 检查并创建数据库
        console.log('正在创建数据库 lch_v4...');
        await connection.execute('DROP DATABASE IF EXISTS lch_v4');
        await connection.execute('CREATE DATABASE lch_v4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await connection.execute('USE lch_v4');
        
        console.log('✅ 数据库创建成功');

        // 读取SQL文件
        const sqlFilePath = path.join(__dirname, 'lch_v4_database_dump.sql');
        console.log('正在读取SQL文件...');
        
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error('找不到数据库文件: lch_v4_database_dump.sql');
        }

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // 清理SQL内容，移除注释和SET语句
        let cleanSql = sqlContent
            .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
            .replace(/--.*$/gm, '') // 移除单行注释
            .replace(/^\/\*.*?\*\/$/gm, '') // 移除注释行
            .replace(/^SET.*$/gm, '') // 移除SET语句
            .replace(/^USE.*$/gm, '') // 移除USE语句
            .replace(/^LOCK TABLES.*$/gm, '') // 移除LOCK语句
            .replace(/^UNLOCK TABLES.*$/gm, '') // 移除UNLOCK语句
            .replace(/^ALTER TABLE.*DISABLE KEYS.*$/gm, '') // 移除DISABLE KEYS
            .replace(/^ALTER TABLE.*ENABLE KEYS.*$/gm, ''); // 移除ENABLE KEYS

        // 分割SQL语句
        const statements = cleanSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => 
                stmt.length > 10 && 
                !stmt.startsWith('--') && 
                !stmt.startsWith('/*') &&
                !stmt.toUpperCase().startsWith('SET ') &&
                !stmt.toUpperCase().startsWith('USE ') &&
                !stmt.toUpperCase().startsWith('LOCK ') &&
                !stmt.toUpperCase().startsWith('UNLOCK ') &&
                !stmt.toUpperCase().startsWith('ALTER TABLE') ||
                stmt.toUpperCase().includes('CREATE TABLE') ||
                stmt.toUpperCase().includes('INSERT INTO')
            );

        console.log(`准备执行 ${statements.length} 条SQL语句...`);

        // 执行SQL语句
        let executed = 0;
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                    executed++;
                    if (executed % 5 === 0) {
                        console.log(`已执行 ${executed}/${statements.length} 条语句...`);
                    }
                } catch (error) {
                    // 输出具体错误信息用于调试
                    console.warn(`警告: ${error.message}`);
                    if (statement.length < 200) {
                        console.warn(`语句: ${statement}`);
                    }
                }
            }
        }

        console.log(`✅ 成功执行 ${executed} 条SQL语句`);

        // 验证数据库初始化结果
        console.log('\n正在验证数据库结构...');
        
        const [tables] = await connection.execute(
            'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema=?',
            ['lch_v4']
        );
        
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [merchants] = await connection.execute('SELECT COUNT(*) as count FROM merchants');
        const [devices] = await connection.execute('SELECT COUNT(*) as count FROM devices');

        console.log(`✅ 数据库表数量: ${tables[0].count}`);
        console.log(`✅ 用户数据: ${users[0].count} 条记录`);
        console.log(`✅ 商户数据: ${merchants[0].count} 条记录`);
        console.log(`✅ 设备数据: ${devices[0].count} 条记录`);

        console.log('\n============================================');
        console.log('              初始化完成！');
        console.log('============================================');
        console.log('\n数据库连接信息:');
        console.log('- 主机: 127.0.0.1:3306');
        console.log('- 数据库: lch_v4');
        console.log('- 用户名: root');
        console.log('- 密码: cCNyGNDDD5Mp6d9f');
        console.log('\n默认管理员账号:');
        console.log('- 用户名: admin');
        console.log('- 密码: 123456');
        console.log('\n现在可以启动项目了！');

    } catch (error) {
        console.error('❌ 数据库初始化失败:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 运行初始化
initDatabase().catch(console.error);