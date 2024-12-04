/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "DbUrl": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "OpenAiApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "audioWorkerQueue": {
      "type": "sst.aws.Queue"
      "url": string
    }
    "ecoutable": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "myFunction": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "myStaticSite": {
      "type": "sst.aws.StaticSite"
      "url": string
    }
  }
}
