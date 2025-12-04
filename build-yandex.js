import { execSync } from 'child_process';
import fs from 'fs';
import archiver from 'archiver';

console.log('Building project...');
try {
    execSync('npm run build', { stdio: 'inherit' });
} catch (e) {
    console.error('Build failed');
    process.exit(1);
}

console.log('Zipping dist folder...');
const output = fs.createWriteStream('yandex-build.zip');
const archive = archiver('zip', {
    zlib: { level: 9 }
});

output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('yandex-build.zip has been created successfully.');
});

archive.on('error', function (err) {
    throw err;
});

archive.pipe(output);
archive.directory('dist/', false);
archive.finalize();
