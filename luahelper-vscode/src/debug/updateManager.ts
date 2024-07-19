import { Tools } from '../common/tools';
import { DebugLogger } from '../common/logManager';
import { VisualSetting } from './visualSetting';
import * as vscode from 'vscode';
import * as fs from "fs";

export class UpdateManager{
    private static checkUpdate = true;

    public setCheckUpdate(state){
        UpdateManager.checkUpdate = state;
    }

    // 获取调试器lua文件的版本号，并提示用户升级
    public checkIfLuaPandaNeedUpdate(LuaPandaPath, rootFolder){
        if(!UpdateManager.checkUpdate || !LuaPandaPath){
            return;
        }

        let luapandaTxt = Tools.readFileContent(LuaPandaPath);
        let dver = luapandaTxt.match(/(?<=local debuggerVer = )("(.*?)")/);
        if(dver && dver.length === 3){
            let DVerArr  = dver[2].split('.');
            let AVerArr = String(Tools.adapterVersion).split(".");
            if (DVerArr.length === AVerArr.length && DVerArr.length === 3 ){
                let intDVer = parseInt(DVerArr[0]) * 10000  + parseInt(DVerArr[1]) * 100 + parseInt(DVerArr[2]);
                let intAVer = parseInt(AVerArr[0]) * 10000  + parseInt(AVerArr[1]) * 100 + parseInt(AVerArr[2]);

                let updateTipSetting = VisualSetting.getLaunchjson(rootFolder , "updateTips");
                if ( intDVer < intAVer && updateTipSetting !== false){
                // if ( intDVer < intAVer){
                    vscode.window.showInformationMessage('LuaPanda VSCodeThe plug-in has been upgraded to version 3.2.0, and it is recommended to upgrade the LuaPanda.lua file at the same time. Please rebuild the launch.json file before starting debugging for the first time to avoid compatibility issues. launch.json configuration project reference https://github.com/Tencent/LuaPanda/blob/master/Docs/Manual/launch-json-introduction.md', "OK");  

                    vscode.window.showInformationMessage('The LuaPanda.lua file in the current project has a lower version. Will it be automatically replaced with the latest version?', 'Yes', 'No', 'Never').then(value => {
                        if(value === "Yes"){
                            let confirmButton = "Upgrade now";
                            vscode.window.showInformationMessage('Ready to update' + LuaPandaPath+ '. If the user has modified this file, it is recommended to back it up before upgrading to avoid the modifications being overwritten', confirmButton, 'Try again later').then(value => {
                                if(value === confirmButton){
                                    this.updateLuaPandaFile(LuaPandaPath)
                                }
                            });
                        }
                        else if(value === "No"){
                            // 本次插件运行期间不再提示
                            vscode.window.showInformationMessage('LuaPanda will no longer pop up an upgrade prompt during this run', "OK");
                            this.setCheckUpdate(false);
                        }else if(value === "Never"){
                            // 永久不再提示升级
                            vscode.window.showInformationMessage('The debugger upgrade prompt will no longer pop up when debugging this project. If you need to upgrade, please refer to https://github.com/Tencent/LuaPanda/blob/master/Docs/Manual/update.md', "OK");
                            this.setCheckUpdate(false);
                            // 把信息标记在 launch.json上
                            VisualSetting.setLaunchjson(rootFolder, "updateTips", false);
                        };
                    });
                }
            }else{
                //版本号异常，不做处理
            }
        }
    }

    // 更新调试器lua文件(读取预置文件，写入工程的目标文件中)
    public updateLuaPandaFile(LuaPandaPath) {
        //文件替换
        let luapandaContent = fs.readFileSync(Tools.getLuaPathInExtension());
        try {
            fs.writeFileSync(LuaPandaPath, luapandaContent);
            DebugLogger.showTips("Upgrade successful, " + LuaPandaPath + " Upgraded to "+ Tools.adapterVersion , 0);
        } catch (error) {
            DebugLogger.showTips("Upgrade failed," + LuaPandaPath + "Writing failed! You can manually replace this file to the latest version of github", 1);
        } finally {
            this.setCheckUpdate(false);
        }
    }
}