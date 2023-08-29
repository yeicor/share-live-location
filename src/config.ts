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
        let oldDefaults = JSON.parse(JSON.stringify(alertify.defaults))
        alertify.defaults.transition = "zoom"
        alertify.defaults.basic = true
        alertify.defaults.closable = false
        alertify.defaults.closableByDimmer = false
        alertify.defaults.moveBounded = true
        alertify.defaults.frameless = true
        alertify.defaults.overflow = false
        let shareButton = document.getElementById("setup-form-share") as HTMLDivElement;
        let receiveButton = document.getElementById("setup-form-receive") as HTMLDivElement;
        shareButton.addEventListener("click", () => {
            shareButton.classList.add("selected")
            receiveButton.classList.remove("selected")
        })
        receiveButton.addEventListener("click", () => {
            shareButton.classList.remove("selected")
            receiveButton.classList.add("selected")
        })
        let prompt = alertify.prompt("Do you want to share or receive location?", "", "share", () => {
        }, () => reject("User rejected configuration dialog"))
            .setContent(document.getElementById("setup-form")!);
        let submitButton = document.getElementById("setup-form-submit") as HTMLButtonElement;
        let ntfyHostInput = document.getElementById("setup-form-ntfy-host") as HTMLInputElement;
        let ntfyTopicInput = document.getElementById("setup-form-ntfy-topic") as HTMLInputElement;
        submitButton.addEventListener("click", () => {
            prompt.close()
            resolve({
                ntfy: new Ntfy(ntfyHostInput.value, ntfyTopicInput.value == "" ? undefined : ntfyTopicInput.value),
                isSharing: shareButton.classList.contains("selected")
            })
        })
        alertify.defaults = oldDefaults
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
            autoConfigUrl = new URL(autoConfigUrlStr, "https://example.com/");
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

    let isSharing = undefined
    console.debug("Auto-config URL pathname: ", autoConfigUrl?.pathname)
    if (autoConfigUrl?.pathname == "/share") { // Automatically share
        isSharing = true
    } else if (autoConfigUrl?.pathname == "/receive") { // Automatically receive
        isSharing = false
    }

    let appConfig: AppConfig
    if (isSharing !== undefined) {
        appConfig = {
            ntfy: new Ntfy(shareHost, shareId),
            isSharing: isSharing
        }
    } else {
        // If there is not enough information to autoconfigure, show the setup dialog
        appConfig = await setupConfigDialog();
    }
    return appConfig
}