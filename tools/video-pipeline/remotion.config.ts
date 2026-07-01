// Remotion CLI/studio config. Node APIs (scripts/make.mjs) ignore this and pass
// options directly. See https://remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Vertical short-form output.
Config.setConcurrency(null); // auto
