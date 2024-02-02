// From https://deno.land/x/m3u8@v0.8.0/src/mod.ts by @fbritoferreira
// https://github.com/fbritoferreira/m3u8-parser/tree/main

export { M3U8Parser } from "./parser.ts";
export {
  Attributes,
  Options,
  Parameters,
  PlaylistItemTvgValidator,
  PlaylistItemValidator,
} from "./types.ts";

export type {
  ParsedLine,
  Playlist,
  PlaylistHeader,
  PlaylistItem,
  PlaylistItemTvg,
} from "./types.ts";

export interface Manifest {
  allowCache: boolean;
  endList: boolean;
  mediaSequence: number;
  discontinuitySequence: number;
  playlistType: string;
  custom: Record<string, unknown>;
  playlists: Array<{
    attributes: Record<string, unknown>;
    uri?: string;
    manifest: Manifest;
  }>;
  mediaGroups: {
    AUDIO: Record<string, Record<string, {
      default: boolean;
      autoselect: boolean;
      language: string;
      uri: string;
      instreamId: string;
      characteristics: string;
      forced: boolean;
    }>>;
    VIDEO: Record<string, unknown>;
    'CLOSED-CAPTIONS': Record<string, unknown>;
    SUBTITLES: Record<string, unknown>;
  };
  dateTimeString: string;
  dateTimeObject: Date;
  targetDuration: number;
  totalDuration: number;
  discontinuityStarts: number[];
  segments: Array<{
    byterange: {
      length: number;
      offset: number;
    };
    duration: number;
    attributes: Record<string, unknown>;
    discontinuity: number;
    uri: string;
    timeline: number;
    key: {
      method: string;
      uri: string;
      iv: string;
    };
    map: {
      uri: string;
      byterange: {
        length: number;
        offset: number;
      };
    };
    'cue-out': string;
    'cue-out-cont': string;
    'cue-in': string;
    custom: Record<string, unknown>;
  }>;
}