/**
 * ADB Intent & Shell Command Generator for App Testing & Customizer Debugging
 */

import { ManifestInfo, ManifestComponent } from '../types/apk';

export interface AdbCommandItem {
  id: string;
  label: string;
  category: 'ACTIVITY' | 'SERVICE' | 'RECEIVER' | 'DIAGNOSTIC';
  command: string;
  description: string;
  componentName: string;
  isExported?: boolean;
}

export function generateAdbCommands(manifest: ManifestInfo): AdbCommandItem[] {
  const commands: AdbCommandItem[] = [];
  const pkg = manifest.packageName;

  // Diagnostic commands
  commands.push({
    id: 'adb-dump-package',
    label: 'Dump Package Details & Permissions',
    category: 'DIAGNOSTIC',
    command: `adb shell dumpsys package ${pkg}`,
    description: 'Displays runtime granted permissions, signatures, and component states on device.',
    componentName: pkg,
    isExported: true,
  });

  commands.push({
    id: 'adb-clear-data',
    label: 'Clear App Data & Cache',
    category: 'DIAGNOSTIC',
    command: `adb shell pm clear ${pkg}`,
    description: 'Resets all private storage, SharedPreferences, and database state.',
    componentName: pkg,
    isExported: true,
  });

  // Components commands
  manifest.components.forEach((comp, idx) => {
    let cleanName = comp.name;
    if (cleanName.startsWith('.')) {
      cleanName = `${pkg}${cleanName}`;
    }

    if (comp.type === 'activity') {
      const isLauncher = comp.intentFilters.some((f) =>
        f.categories.includes('android.intent.category.LAUNCHER')
      );

      let cmd = `adb shell am start -n ${pkg}/${cleanName}`;
      if (isLauncher) {
        cmd += ` -a android.intent.action.MAIN -c android.intent.category.LAUNCHER`;
      }

      commands.push({
        id: `adb-act-${idx}`,
        label: `Launch ${comp.name.split('.').pop()}`,
        category: 'ACTIVITY',
        command: cmd,
        description: comp.exported
          ? 'Launches exported activity directly without root requirements.'
          : 'Launches internal activity (requires root or adb run-as).',
        componentName: cleanName,
        isExported: comp.exported,
      });

      // If activity has custom action
      comp.intentFilters.forEach((f, fIdx) => {
        if (f.actions.length > 0 && !f.actions.includes('android.intent.action.MAIN')) {
          commands.push({
            id: `adb-act-${idx}-action-${fIdx}`,
            label: `Trigger Action: ${f.actions[0].split('.').pop()}`,
            category: 'ACTIVITY',
            command: `adb shell am start -a "${f.actions[0]}" -n ${pkg}/${cleanName}`,
            description: `Dispatches intent action "${f.actions[0]}" directly to ${cleanName}.`,
            componentName: cleanName,
            isExported: comp.exported,
          });
        }
      });
    } else if (comp.type === 'receiver') {
      const action = comp.intentFilters[0]?.actions[0] || `${pkg}.ACTION_TEST`;
      commands.push({
        id: `adb-rec-${idx}`,
        label: `Send Broadcast to ${comp.name.split('.').pop()}`,
        category: 'RECEIVER',
        command: `adb shell am broadcast -a "${action}" -n ${pkg}/${cleanName}`,
        description: `Dispatches broadcast intent with action "${action}".`,
        componentName: cleanName,
        isExported: comp.exported,
      });
    } else if (comp.type === 'service') {
      commands.push({
        id: `adb-srv-${idx}`,
        label: `Start Service: ${comp.name.split('.').pop()}`,
        category: 'SERVICE',
        command: `adb shell am startservice -n ${pkg}/${cleanName}`,
        description: `Starts background service on device.`,
        componentName: cleanName,
        isExported: comp.exported,
      });
    }
  });

  return commands;
}
