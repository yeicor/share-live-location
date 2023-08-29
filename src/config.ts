import {Ntfy} from "./ntfy";
import alertify from "alertifyjs";
import "alertifyjs/build/css/alertify.css";

export type AppConfig = {
    /** The server (and room) to use for sharing/receiving data. */
    ntfy: Ntfy,
    /** Whether the user is sharing (otherwise receiving) the location. */
    isSharing: boolean,
}

function setupConfigDialog(): Promise<AppConfig> {
    return new Promise((resolve, reject) => {
        alertify.prompt("Do you want to share or receive location?", "", "share", (e: any, isSharing: string) => {
            alertify.alert("You clicked: " + isSharing + " -- " + JSON.stringify(e));
            resolve({ntfy: new Ntfy(), isSharing: isSharing == "share"})
        }, () => reject("User rejected configuration dialog"))//.setContent("TODO")
    })
}

export async function setupConfig(): Promise<AppConfig> {
    // Get configuration from URL hash
    let autoConfigUrl = undefined
    let fullUrl = new URL(window.location.href);
    if (fullUrl.hash.startsWith("#")) {
        try {
            let autoConfigUrlStr = fullUrl.hash.substring(1);
            console.debug("Auto-config URL: ", autoConfigUrlStr);
            autoConfigUrl = new URL(autoConfigUrlStr, window.location.href);
        } catch (e) {
            console.error("Failed to parse auto-config URL: ", e);
            alertify.error("Failed to parse auto-config URL: " + e);
        }
    }

    // Retrieve auto-config parameters
    let shareHost = autoConfigUrl?.searchParams?.get("host")
    if (shareHost == null) shareHost = undefined
    let shareId = autoConfigUrl?.searchParams?.get("id")
    if (shareId == null) shareId = undefined
    const ntfyShare = new Ntfy(shareHost, shareId)

    let isSharing = undefined
    if (autoConfigUrl?.pathname == "s") { // Automatically share
        isSharing = true
    } else if (autoConfigUrl?.pathname == "r") { // Automatically receive
        isSharing = false
    }

    // If there is not enough information to autoconfigure, show the configuration dialog
    let appConfig: AppConfig = {ntfy: ntfyShare, isSharing: isSharing}
    if (appConfig.isSharing == undefined) {
        appConfig = await setupConfigDialog();
    }
    return appConfig
}