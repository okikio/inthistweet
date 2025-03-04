import type { ErrorData, ManifestParsedData, ManifestLoadedData, FragLoadedData, FragDecryptedData, FragParsingUserdataData, NetworkComponentAPI, LevelLoadedData, FragLoadEmergencyAbortedData, BufferCreatedData, BufferFlushedData, LevelsUpdatedData, FragBufferedData, AudioTrackSwitchedData, Fragment, Part, BufferEOSData, BufferInfo, Level } from "hls.js";
import type { default as StreamController } from "../../../node_modules/hls.js/src/controller/stream-controller.ts";
import HLS, { Events, BaseStreamController, PlaylistLevelType, } from "hls.js";

// @ts-ignore - This is a workaround for the lack `location` in Node.js
globalThis.location ??= new URL("https://example.com");
// @ts-ignore - This is a workaround for the lack `navigator` in Node.js
globalThis.navigator ??= {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0'
}

// Defining the MediaSourceEndOfStreamError enumeration as an object
// Since TypeScript enums are objects under the hood, this approach is somewhat similar
const MediaSourceEndOfStreamError = {
  NETWORK: "network",
  DECODE: "decode",
  EOS: "endOfStream", // Adding a custom value for normal end of stream without errors
};

// @ts-ignore - Workaround for the lack of `MediaSource` in Node.js environments
globalThis.MediaSource ??= class extends EventTarget {
  static isTypeSupported(mimeType: string): boolean {
    // Simplistic check; real implementations have more complex criteria
    return mimeType.startsWith('video/') || mimeType.startsWith('audio/');
  }

  sourceBuffers: SourceBuffer[];
  activeSourceBuffers: SourceBuffer[];
  readyState: string;

  constructor() {
    super();
    this.sourceBuffers = [];
    this.activeSourceBuffers = []; // Represents the SourceBuffers that are currently being presented
    this.readyState = "closed";
  }

  addSourceBuffer(mimeType: string): SourceBuffer {
    if (!MediaSource.isTypeSupported(mimeType)) {
      throw new DOMException("The type is not supported.", "NotSupportedError");
    }

    const sourceBuffer = new SourceBuffer(mimeType);
    this.sourceBuffers.push(sourceBuffer);
    sourceBuffer.addEventListener('updateend', () => {
      // Example of handling events from SourceBuffer
    });
    // Transition the MediaSource state to open when a source buffer is added
    this.readyState = "open";
    this.dispatchEvent(new Event('sourceopen')); // Simulate the sourceopen event
    return sourceBuffer;
  }

  removeSourceBuffer(sourceBuffer: SourceBuffer): void {
    const index = this.sourceBuffers.indexOf(sourceBuffer);
    if (index === -1) {
      throw new DOMException("The specified SourceBuffer was not found.", "NotFoundError");
    }
    this.sourceBuffers.splice(index, 1);
  }

  endOfStream(error?: keyof typeof MediaSourceEndOfStreamError): void {
    // The logic here can be adjusted based on the specific needs of the polyfill
    // For now, it simply sets the readyState and logs the error (if any)
    switch (error) {
      case "NETWORK":
        console.log("MediaSource ended due to network error.");
        break;
      case "DECODE":
        console.log("MediaSource ended due to decoding error.");
        break;
      case "EOS":
        console.log("MediaSource ended stream normally.");
        break;
      default:
        console.log("MediaSource endOfStream called without specific error.");
    }

    // Set the readyState to 'ended' to simulate the end of stream
    this.readyState = "ended";
    // Dispatching the 'sourceended' event to mimic the browser's behavior
    this.dispatchEvent(new Event('sourceended'));
  }

  // Additional methods like setLiveSeekableRange() and clearLiveSeekableRange() could be added for completeness
}

class SourceBuffer extends EventTarget {
  mimeType: string;
  updating: boolean;
  buffered: TimeRanges;

  constructor(mimeType: string) {
    super();
    this.mimeType = mimeType;
    this.updating = false;
    // Simulate the buffered ranges as an empty TimeRanges object
    // In a real implementation, this would represent the time ranges of buffered media data
    this.buffered = {
      length: 0,
      start: () => { throw new Error("This TimeRanges object is empty."); },
      end: () => { throw new Error("This TimeRanges object is empty."); },
    };
  }

  appendBuffer(data: ArrayBuffer | ArrayBufferView): void {
    if (this.updating) {
      throw new DOMException("SourceBuffer is currently updating.", "InvalidStateError");
    }
    // Simulate asynchronous buffer updating process
    setTimeout(() => {
      this.updating = false;
      this.dispatchEvent(new Event('updateend')); // Signal the end of the buffer update
    }, 0);
  }

  // Methods like remove(), abort(), etc., can be similarly mocked
}

// Usage example: would be similar to standard MediaSource API usage, but functionality like actual video playback wouldn't be supported by this polyfill alone.


/**
 * Represents the possible states of the HLS.js player.
 */
export const State = {
  STOPPED: 'STOPPED',
  IDLE: 'IDLE',
  KEY_LOADING: 'KEY_LOADING',
  FRAG_LOADING: 'FRAG_LOADING',
  FRAG_LOADING_WAITING_RETRY: 'FRAG_LOADING_WAITING_RETRY',
  WAITING_TRACK: 'WAITING_TRACK',
  PARSING: 'PARSING',
  PARSED: 'PARSED',
  ENDED: 'ENDED',
  ERROR: 'ERROR',
  WAITING_INIT_PTS: 'WAITING_INIT_PTS',
  WAITING_LEVEL: 'WAITING_LEVEL',
};

export const enum FragmentState {
  NOT_LOADED = 'NOT_LOADED',
  APPENDING = 'APPENDING',
  PARTIAL = 'PARTIAL',
  OK = 'OK',
}

/**
 * Creates a Promise and provides external access to its resolve and reject functions.
 *
 * This can be useful in scenarios where you need a promise that will be resolved or rejected
 * at a later time, outside of the promise's executor function. For example, you might want to
 * wait for a user action to resolve a promise, such as clicking a button, or you might want to
 * resolve a promise after receiving data from an asynchronous operation that was initiated elsewhere.
 *
 * Returns an object containing the promise itself along with its resolve and reject functions,
 * allowing for flexible control over the promise's resolution.
 *
 * @returns {Object} An object containing three properties: promise, resolve, and reject.
 * - promise: The Promise object that can be awaited or then-ed.
 * - resolve: A function that, when called, resolves the promise with an optional value.
 * - reject: A function that, when called, rejects the promise with an optional reason.
 *
 * @example
 * // Example: Using withResolvers to delay a task until a user action occurs.
 * const { promise, resolve } = withResolvers();
 * 
 * // Assume we have a button in our application that, when clicked,
 * // should resolve the promise.
 * document.getElementById('myButton').addEventListener('click', () => {
 *   console.log('Button clicked, promise will now resolve.');
 *   resolve('Button was clicked');
 * });
 *
 * // Somewhere else in the application, we can await the resolution
 * // of the promise to continue our logic.
 * async function waitForButtonClick() {
 *   const message = await promise;
 *   console.log('Promise resolved with message:', message);
 *   // Continue with further actions after the button click has been handled.
 * }
 * 
 * waitForButtonClick();
 *
 * @example
 * // Example: Using withResolvers in an asynchronous data loading scenario.
 * const { promise, resolve, reject } = withResolvers();
 * 
 * fetchDataFromApi().then(data => {
 *   if (data) {
 *     // Resolve the promise with the data if the API call was successful.
 *     resolve(data);
 *   } else {
 *     // Reject the promise if the API call did not return data.
 *     reject('No data returned from the API');
 *   }
 * }).catch(error => {
 *   // Reject the promise if an error occurred during the API call.
 *   reject(error);
 * });
 *
 * async function useData() {
 *   try {
 *     const data = await promise;
 *     console.log('Data received:', data);
 *     // Process the data...
 *   } catch (error) {
 *     console.error('Error fetching data:', error);
 *     // Handle error...
 *   }
 * }
 *
 * useData();
 */
export function withResolvers<T extends unknown>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => { };
  let reject: (reason?: any) => void = () => { };
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Simulates the TimeRanges interface, commonly used with media elements to represent
 * ranges of time that have been buffered, played, or are seekable.
 */
export class TimeRangesPolyfill {
  protected ranges: Array<[number, number]>;

  /**
   * Initializes an instance of the TimeRangesPolyfill class.
   */
  constructor() {
    this.ranges = [];
  }

  /**
   * Gets the number of time ranges currently stored.
   * @returns {number} The number of time ranges.
   */
  get length(): number {
    return this.ranges.length;
  }

  /**
   * Retrieves the start time of a specified time range.
   * @param {number} index The index of the time range to retrieve the start for.
   * @returns {number} The start time of the time range.
   * @throws Will throw an error if the index is out of range.
   */
  start(index: number): number {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of range");
    }
    return this.ranges[index][0];
  }

  /**
   * Retrieves the end time of a specified time range.
   * @param {number} index The index of the time range to retrieve the end for.
   * @returns {number} The end time of the time range.
   * @throws Will throw an error if the index is out of range.
   */
  end(index: number): number {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of range");
    }
    return this.ranges[index][1];
  }

  /**
   * Adds a new time range to the collection. Note: This method doesn't merge or sort ranges.
   * In a real implementation, you might want to merge overlapping ranges.
   * @param {number} start The start time of the range to add.
   * @param {number} end The end time of the range to add.
   */
  addRange(start: number, end: number): void {
    this.ranges.push([start, end]);
  }
}

interface TextTrack {
  kind: string;
  label: string;
}

interface MockMediaElement extends EventTarget {
  paused: boolean;
  currentTime: number;
  readyState: boolean;
  textTracks: TextTrack[];
  addTextTrack(kind: string, label: string): void;
  buffered: TimeRangesPolyfill;
  simulateBuffering(start: number, end: number): void;
}


const TICK_INTERVAL = 100; // how often to tick in ms

class CustomController extends BaseStreamController implements NetworkComponentAPI {
  private backtrackFragment: Fragment | null = null;
  protected media: HTMLMediaElement | null = null;

  private altAudio: boolean = false;
  private audioOnly: boolean = false;
  private videoBuffer: any | null = null;

  private _forceStartLoad: boolean = false;
  private couldBacktrack: boolean = false;
  private level: number = -1;

  constructor(
    protected hls: HLS,
    protected resolvers: ReturnType<typeof withResolvers<ManifestParsedData>>
  ) {
    super(
      hls,
      // @ts-ignore
      hls.streamController.fragmentTracker,
      // @ts-ignore
      hls.streamController.keyLoader,
      '[custom-controller]',
      // @ts-ignore
      PlaylistLevelType.MAIN,
    );
    this._registerListeners();
    this.config = hls.config;
  }


  protected _registerListeners() {
    const { hls } = this;

    hls.on(Events.ERROR, this.onError, this);

    hls.on(Events.BUFFER_CREATED, this.onBufferCreated, this);
    hls.on(Events.BUFFER_FLUSHED, this.onBufferFlushed, this);

    hls.on(Events.MEDIA_ATTACHED, this.onMediaAttached, this);

    hls.on(Events.MANIFEST_LOADED, this.onManifestLoaded, this);
    hls.on(Events.MANIFEST_PARSED, this.onManifestParsed, this);

    hls.on(Events.FRAG_LOADED, this.onFragLoaded, this);
    hls.on(Events.FRAG_BUFFERED, this.onFragBuffered, this);
    hls.on(Events.FRAG_PARSING_USERDATA, this.onFragParsingUserdata, this);
    hls.on(
      Events.FRAG_LOAD_EMERGENCY_ABORTED,
      this.onFragLoadEmergencyAborted,
      this,
    );

    hls.off(Events.LEVEL_LOADED, this.onLevelLoaded, this);
    hls.off(Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
  }

  protected _unregisterListeners() {
    const { hls } = this;

    hls.off(Events.ERROR, this.onError, this);

    hls.off(Events.BUFFER_CREATED, this.onBufferCreated, this);
    hls.off(Events.BUFFER_FLUSHED, this.onBufferFlushed, this);

    hls.off(Events.MEDIA_ATTACHED, this.onMediaAttached, this);

    hls.off(Events.MANIFEST_LOADED, this.onManifestLoaded, this);
    hls.off(Events.MANIFEST_PARSED, this.onManifestParsed, this);

    hls.off(Events.FRAG_LOADED, this.onFragLoaded, this);
    hls.off(Events.FRAG_BUFFERED, this.onFragBuffered, this);
    hls.off(Events.FRAG_PARSING_USERDATA, this.onFragParsingUserdata, this);
    hls.off(
      Events.FRAG_LOAD_EMERGENCY_ABORTED,
      this.onFragLoadEmergencyAborted,
      this,
    );

    hls.off(Events.LEVEL_LOADED, this.onLevelLoaded, this);
    hls.off(Events.LEVELS_UPDATED, this.onLevelsUpdated, this);
  }

  protected onHandlerDestroying() {
    this._unregisterListeners();
    super.onHandlerDestroying();
  }

  public startLoad(startPosition: number): void {
    super.startLoad(startPosition);
  }

  public stopLoad() {
    this._forceStartLoad = false;
    super.stopLoad();
  }

  /**
   * For subclass to implement task logic
   * @abstract
   */
  protected doTick(): void {
    super.doTick();
  }

  protected onManifestLoaded(
    event: Events.MANIFEST_LOADED,
    data: ManifestLoadedData,
  ) {
    super.onManifestLoaded(event, data);
  }
  protected onManifestParsed(
    event: Events.MANIFEST_PARSED,
    data: ManifestParsedData,
  ) {
    const { hls } = this;

    // @ts-ignore
    const streamController = (hls.streamController as StreamController);
    streamController.tick();

    this.resolvers.resolve(data);
  }
  protected onFragLoaded(
    event: Events.FRAG_LOADED,
    data: FragDecryptedData | FragLoadedData,
  ) {
  }
  protected onFragBuffered(
    event: Events.FRAG_BUFFERED,
    data: FragBufferedData,
  ) {
  }
  protected onFragBufferedComplete(
    frag: Fragment, part: Part | null
  ) {
    console.log({
      frag,
      part,
      state: this.state,
      media: this.media,
      // level: this.level,

      nextLoadPosition: this.nextLoadPosition,
      startPosition: this.startPosition,
      lastCurrentTime: this.lastCurrentTime,
    });
  }
  protected onFragParsingUserdata(
    event: Events.FRAG_PARSING_USERDATA,
    data: FragParsingUserdataData,
  ) { }
  protected onFragLoadEmergencyAborted(
    event: Events.FRAG_LOAD_EMERGENCY_ABORTED,
    data: FragLoadEmergencyAbortedData,
  ) { }
  protected onLevelLoaded(
    event: Events.LEVEL_LOADED,
    data: LevelLoadedData,
  ) { }
  protected onLevelsUpdated(
    event: Events.LEVELS_UPDATED,
    data: LevelsUpdatedData,
  ) { }
  protected onBufferCreated(
    event: Events.BUFFER_CREATED,
    data: BufferCreatedData,
  ) { }
  protected onBufferFlushed(
    event: Events.BUFFER_FLUSHED,
    data: BufferFlushedData,
  ) { }
  protected onAudioTrackSwitched(
    event: Events.AUDIO_TRACK_SWITCHED,
    data: AudioTrackSwitchedData,
  ) { }
  protected onError(
    event: Events.ERROR,
    data: ErrorData,
  ) {
    this.resolvers.reject(data);
  }
}

/**
 * Traverse M3U8 manifests and fetches the referenced resources within a 2-minute limit.
 * 
 * This function is optimized for performance by minimizing redundant array operations and 
 * efficiently managing network requests. It processes an M3U8 file, fetching all unique URIs 
 * referenced in it and any nested M3U8 files, and aborts if the operation exceeds 2 minutes.
 * 
 * Performance is optimized by using Sets for deduplication and minimizing array transformations.
 * The function handles edge cases like undefined URIs and nested M3U8 files.
 * 
 * @param arrbuf - An ArrayBuffer containing the contents of the M3U8 file.
 * @param baseUrl - The base URL used for resolving relative URIs in the M3U8 file.
 * @param batchSize - Batch the fetch requests in increments of `batchSize`, this is primarily used for resolving relative URIs in the M3U8 file.
 * @param timeout - Timeout for batch requests.
 */
export function traverseManifest(url: string | URL) {
  const resolvers = withResolvers<ManifestParsedData>();
  const hls = new HLS({
    progressive: true,
    autoStartLoad: true,
    startFragPrefetch: true,
    testBandwidth: true,
    startLevel: -1
  });

  const _url = new URL(url);
  hls.loadSource(_url.href);
  hls.createController(class WrapperController {
    constructor(hls: HLS) {
      const customController = new CustomController(hls, resolvers);
      // @ts-ignore
      hls.networkControllers.push(customController);
    }
  }, []);

  return [hls, resolvers.promise] as const;
}
