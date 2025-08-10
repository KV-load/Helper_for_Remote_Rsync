// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
const util = require('util');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const exec = util.promisify(require('child_process').exec);


let AIX_USER = '';
let AIX_HOST = '';
let mount_dir = '';
let keyPath = '';
let config = '';



function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	
	console.log('Congratulations, your extension "helper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('helper.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user

		vscode.window.showInformationMessage('Hello World from Helper!');

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('No workspace folder is open.');
			return;
		}	
		const workspacePath = workspaceFolders[0].uri.fsPath;
		const configPath = path.join(workspacePath, '/aix_config.json');
        


		vscode.window.showInformationMessage(`Checking for AIX configuration file at: ${configPath}`);
		if (!fs.existsSync(configPath)) {
			vscode.window.showErrorMessage('AIX configuration file not found in the workspace.');
			return;
		}
		config = fs.readFileSync(configPath, 'utf8');

		let config_file = JSON.parse(config);
		AIX_USER = config_file.aix_user;
		AIX_HOST = config_file.aix_host;
		mount_dir = workspacePath;
		keyPath = `${process.env.HOME}/.ssh/id_rsa_${AIX_HOST}`;
        

        vscode.workspace.onDidSaveTextDocument((doc) => {
		config = fs.readFileSync(configPath, 'utf8');
		config_file = JSON.parse(config);
        console.log(`File saved: ${doc.fileName}`);
        let filename = path.basename(doc.fileName);
		let File_dict = config_file['FILES'] || {};
       
     
		if (File_dict[filename]) {
			vscode.window.showInformationMessage(`File ${File_dict[filename]} is synced, pushing to AIX...`);
			// console.log(`File ${filename} is synced, pushing to AIX...`);
			vscode.window.showInformationMessage(`File saved: ${doc.fileName}`);
			pushToAix(File_dict[filename],doc.fileName);
		} else {
			console.log(`File ${filename} is not synced, skipping push.`);
		}
        // if (syncedFilePath && doc.fileName === syncedFilePath) {
        //     console.log(`File ${doc.fileName} is synced, pushing to AIX...`);
        //     vscode.window.showInformationMessage(`File saved: ${doc.fileName}`);
        //     pushToAix(target);
        // }
    });
		vscode.window.showInformationMessage('AIX configuration file found.');
	
	});

	context.subscriptions.push(disposable);
}


function pushToAix(filePath,localfilepath) {
    if (!filePath) return;
    const remoteTarget = `${AIX_USER}@${AIX_HOST}:${filePath}`;
	vscode.window.showInformationMessage(`Pushing file to AIX: ${remoteTarget}`);
    const rsyncCmd = `rsync -avz -e "ssh -i ${keyPath}" "${localfilepath}" ${remoteTarget}`;
    exec(rsyncCmd).catch(err => console.error(`Push failed: ${err}`));
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
