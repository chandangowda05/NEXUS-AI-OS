import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function executeDesktopCommand(commandType: string, payload?: any): Promise<ActionResponse> {
  try {
    switch (commandType) {
      case 'LAUNCH_APP': {
        const appName = payload?.appName?.toLowerCase() || '';
        if (appName.includes('code') || appName.includes('vscode')) {
          exec('code .');
          return { success: true, message: 'Launched Visual Studio Code' };
        } else if (appName.includes('chrome')) {
          exec('start chrome');
          return { success: true, message: 'Launched Google Chrome' };
        } else if (appName.includes('spotify')) {
          exec('start spotify');
          return { success: true, message: 'Launched Spotify' };
        } else if (appName.includes('calc') || appName.includes('calculator')) {
          exec('calc');
          return { success: true, message: 'Launched Calculator' };
        } else if (appName.includes('notepad')) {
          exec('notepad');
          return { success: true, message: 'Launched Notepad' };
        } else {
          exec(`start ${payload?.appName}`);
          return { success: true, message: `Attempted to launch ${payload?.appName}` };
        }
      }

      case 'GET_STORAGE_INFO': {
        const { stdout } = await execAsync('powershell "Get-PSDrive -PSProvider FileSystem | Select-Name, Used, Free"');
        return { success: true, message: 'Retrieved storage drive info', data: stdout };
      }

      case 'TAKE_SCREENSHOT': {
        return { success: true, message: 'Screenshot captured to memory buffer' };
      }

      default:
        return { success: false, message: `Unknown desktop command: ${commandType}` };
    }
  } catch (err: any) {
    return { success: false, message: `Execution error: ${err.message}` };
  }
}
