/*
 * This method throws if the supplied value is not an array.
 * The destructed values are required to produce a meaningful error for users.
 * The destructed and restructured object is so it's clear what is
 * needed.
 */
const isArray = (value, details) => {
  if (!Array.isArray(value)) {
    throw (({ moduleName, className, funcName, paramName }) => {
      if (!moduleName || !className || !funcName || !paramName) {
        throw new Error(`Unexpected input to 'not-an-array' error.`);
      }
      return (`The parameter '${paramName}' passed into ` +
        `'${moduleName}.${className}.${funcName}()' must be an array.`);
    })(details);
  }
};
const hasMethod = (object, expectedMethod, details) => {
  const type = typeof object[expectedMethod];
  if (type !== 'function') {
    details['expectedMethod'] = expectedMethod;
    throw (({ expectedMethod, paramName, moduleName, className, funcName, }) => {
      if (!expectedMethod ||
        !paramName ||
        !moduleName ||
        !className ||
        !funcName) {
        throw new Error(`Unexpected input to 'missing-a-method' error.`);
      }
      return (`${moduleName}.${className}.${funcName}() expected the ` +
        `'${paramName}' parameter to expose a '${expectedMethod}' method.`);
    })(details);
  }
};
const isType = (object, expectedType, details) => {
  if (typeof object !== expectedType) {
    details['expectedType'] = expectedType;
    throw (({ paramName, moduleName, className, funcName, }) => {
      if (!expectedType || !paramName || !moduleName || !funcName) {
        throw new Error(`Unexpected input to 'incorrect-type' error.`);
      }
      const classNameStr = className ? `${className}.` : '';
      return (`The parameter '${paramName}' passed into ` +
        `'${moduleName}.${classNameStr}` +
        `${funcName}()' must be of type ${expectedType}.`);
    })(details);
  }
};
const isInstance = (object, 
  // Need the general type to do the check later.
  // eslint-disable-next-line @typescript-eslint/ban-types
  expectedClass, details) => {
  if (!(object instanceof expectedClass)) {
    details['expectedClassName'] = expectedClass.name;
    throw (({ expectedClassName, paramName, moduleName, className, funcName, isReturnValueProblem, }) => {
      if (!expectedClassName || !moduleName || !funcName) {
        throw new Error(`Unexpected input to 'incorrect-class' error.`);
      }
      const classNameStr = className ? `${className}.` : '';
      if (isReturnValueProblem) {
        return (`The return value from ` +
          `'${moduleName}.${classNameStr}${funcName}()' ` +
          `must be an instance of class ${expectedClassName}.`);
      }
      return (`The parameter '${paramName}' passed into ` +
        `'${moduleName}.${classNameStr}${funcName}()' ` +
        `must be an instance of class ${expectedClassName}.`);
    })(details);
  }
};
const isOneOf = (value, validValues, details) => {
  if (!validValues.includes(value)) {
    details['validValueDescription'] = `Valid values are ${JSON.stringify(validValues)}.`;
    throw (({ paramName, validValueDescription, value }) => {
      if (!paramName || !validValueDescription) {
        throw new Error(`Unexpected input to 'invalid-value' error.`);
      }
      return (`The '${paramName}' parameter was given a value with an ` +
        `unexpected value. ${validValueDescription} Received a value of ` +
        `${JSON.stringify(value)}.`);
    })(details);
  }
};
const isArrayOfClass = (value, 
  // Need general type to do check later.
  expectedClass,  // eslint-disable-line
  details) => {
  const error = (({ value, moduleName, className, funcName, paramName, }) => {
    return (`The supplied '${paramName}' parameter must be an array of ` +
      `'${expectedClass}' objects. Received '${JSON.stringify(value)},'. ` +
      `Please check the call to ${moduleName}.${className}.${funcName}() ` +
      `to fix the issue.`);
  })(details);
  if (!Array.isArray(value)) {
    throw error;
  }
  for (const item of value) {
    if (!(item instanceof expectedClass)) {
      throw error;
    }
  }
};

const assert = process.env.NODE_ENV === 'production'
  ? null
  : {
    hasMethod,
    isArray,
    isInstance,
    isOneOf,
    isType,
    isArrayOfClass,
  };

const logger = (process.env.NODE_ENV === 'production'
  ? null
  : (() => {
    // Don't overwrite this value if it's already set.
    // See https://github.com/GoogleChrome/workbox/pull/2284#issuecomment-560470923
    if (!('__WB_DISABLE_DEV_LOGS' in globalThis)) {
      // @ts-ignore
      globalThis.__WB_DISABLE_DEV_LOGS = false;
    }
    let inGroup = false;
    const methodToColorMap = {
      debug: `#7f8c8d`,
      log: `#2ecc71`,
      warn: `#f39c12`,
      error: `#c0392b`,
      groupCollapsed: `#3498db`,
      groupEnd: null, // No colored prefix on groupEnd
    };
    const print = function (method, args) {
      // @ts-ignore
      if (globalThis.__WB_DISABLE_DEV_LOGS) {
        return;
      }
      if (method === 'groupCollapsed') {
        // Safari doesn't print all console.groupCollapsed() arguments:
        // https://bugs.webkit.org/show_bug.cgi?id=182754
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
          // @ts-ignore
          console[method](...args);
          return;
        }
      }
      const styles = [
        `background: ${methodToColorMap[method]}`,
        `border-radius: 0.5em`,
        `color: white`,
        `font-weight: bold`,
        `padding: 2px 0.5em`,
      ];
      // When in a group, the workbox prefix is not displayed.
      const logPrefix = inGroup ? [] : ['%cworkbox', styles.join(';')];
      // @ts-ignore
      console[method](...logPrefix, ...args);
      if (method === 'groupCollapsed') {
        inGroup = true;
      }
      if (method === 'groupEnd') {
        inGroup = false;
      }
    };
    // eslint-disable-next-line @typescript-eslint/ban-types
    const api = {};
    const loggerMethods = Object.keys(methodToColorMap);
    for (const key of loggerMethods) {
      const method = key;
      api[method] = (...args) => {
        print(method, args);
      };
    }
    return api;
  })());

/**
 * @param {string} rangeHeader A Range: header value.
 * @return {Object} An object with `start` and `end` properties, reflecting
 * the parsed value of the Range: header. If either the `start` or `end` are
 * omitted, then `null` will be returned.
 *
 * @private
 */
export function parseRangeHeader(rangeHeader) {
  const normalizedRangeHeader = rangeHeader.trim().toLowerCase();
  if (!normalizedRangeHeader.startsWith('bytes=')) {
    throw (({ normalizedRangeHeader }) => {
      if (!normalizedRangeHeader) {
        throw new Error(`Unexpected input to 'unit-must-be-bytes' error.`);
      }
      return (`The 'unit' portion of the Range header must be set to 'bytes'. ` +
        `The Range header provided was "${normalizedRangeHeader}"`)
    })({ normalizedRangeHeader });
  }
  // Specifying multiple ranges separate by commas is valid syntax, but this
  // library only attempts to handle a single, contiguous sequence of bytes.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range#Syntax
  if (normalizedRangeHeader.includes(',')) {
    throw (({ normalizedRangeHeader }) => {
      if (!normalizedRangeHeader) {
        throw new Error(`Unexpected input to 'single-range-only' error.`);
      }
      return (`Multiple ranges are not supported. Please use a  single start ` +
        `value, and optional end value. The Range header provided was ` +
        `"${normalizedRangeHeader}"`);
    })({ normalizedRangeHeader });
  }
  const rangeParts = /(\d*)-(\d*)/.exec(normalizedRangeHeader);
  // We need either at least one of the start or end values.
  if (!rangeParts || !(rangeParts[1] || rangeParts[2])) {
    throw (({ normalizedRangeHeader }) => {
      if (!normalizedRangeHeader) {
        throw new Error(`Unexpected input to 'invalid-range-values' error.`);
      }
      return (`The Range header is missing both start and end values. At least ` +
        `one of those values is needed. The Range header provided was ` +
        `"${normalizedRangeHeader}"`);
    })({ normalizedRangeHeader });
  }
  return {
    start: rangeParts[1] === '' ? undefined : Number(rangeParts[1]),
    end: rangeParts[2] === '' ? undefined : Number(rangeParts[2]),
  };
}

/**
 * @param {Blob} blob A source blob.
 * @param {number} [start] The offset to use as the start of the
 * slice.
 * @param {number} [end] The offset to use as the end of the slice.
 * @return {Object} An object with `start` and `end` properties, reflecting
 * the effective boundaries to use given the size of the blob.
 *
 * @private
 */
export function calculateEffectiveBoundaries(blob, start, end) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isInstance(blob, Blob, {
      moduleName: 'workbox-range-requests',
      funcName: 'calculateEffectiveBoundaries',
      paramName: 'blob',
    });
  }
  const blobSize = blob.size;
  if ((end && end > blobSize) || (start && start < 0)) {
    throw ((start, end, size ) => {
      return (`The start (${start}) and end (${end}) values in the Range are ` +
        `not satisfiable by the cached response, which is ${size} bytes.`);
    })({ start, end, size: blobSize });
  }
  let effectiveStart;
  let effectiveEnd;
  if (start !== undefined && end !== undefined) {
    effectiveStart = start;
    // Range values are inclusive, so add 1 to the value.
    effectiveEnd = end + 1;
  }
  else if (start !== undefined && end === undefined) {
    effectiveStart = start;
    effectiveEnd = blobSize;
  }
  else if (end !== undefined && start === undefined) {
    effectiveStart = blobSize - end;
    effectiveEnd = blobSize;
  }
  return {
    start: effectiveStart,
    end: effectiveEnd,
  };
}

/**
 * Given a `Request` and `Response` objects as input, this will return a
 * promise for a new `Response`.
 *
 * If the original `Response` already contains partial content (i.e. it has
 * a status of 206), then this assumes it already fulfills the `Range:`
 * requirements, and will return it as-is.
 *
 * @param {Request} request A request, which should contain a Range:
 * header.
 * @param {Response} originalResponse A response.
 * @return {Promise<Response>} Either a `206 Partial Content` response, with
 * the response body set to the slice of content specified by the request's
 * `Range:` header, or a `416 Range Not Satisfiable` response if the
 * conditions of the `Range:` header can't be met.
 *
 * @memberof workbox-range-requests
 */
export async function createPartialResponse(request, originalResponse) {
  try {
    if (originalResponse.status === 206) {
      // If we already have a 206, then just pass it through as-is;
      // see https://github.com/GoogleChrome/workbox/issues/1720
      return originalResponse;
    }
    const rangeHeader = request.headers.get('range');
    if (!rangeHeader) {
      throw (() => {
        return `No Range header was found in the Request provided.`;
      })();
    }
    const boundaries = parseRangeHeader(rangeHeader);
    const originalBlob = await originalResponse.blob();
    const effectiveBoundaries = calculateEffectiveBoundaries(originalBlob, boundaries.start, boundaries.end);
    const slicedBlob = originalBlob.slice(effectiveBoundaries.start, effectiveBoundaries.end);
    const slicedBlobSize = slicedBlob.size;
    const slicedResponse = new Response(slicedBlob, {
      // Status code 206 is for a Partial Content response.
      // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206
      status: 206,
      statusText: 'Partial Content',
      headers: originalResponse.headers,
    });
    slicedResponse.headers.set('Content-Length', String(slicedBlobSize));
    slicedResponse.headers.set('Content-Range', `bytes ${effectiveBoundaries.start}-${effectiveBoundaries.end - 1}/` +
      `${originalBlob.size}`);
    return slicedResponse;
  }
  catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn(`Unable to construct a partial response; returning a ` +
        `416 Range Not Satisfiable response instead.`);
      logger.groupCollapsed(`View details here.`);
      logger.log(error);
      logger.log(request);
      logger.log(originalResponse);
      logger.groupEnd();
    }
    return new Response('', {
      status: 416,
      statusText: 'Range Not Satisfiable',
    });
  }
}


/**
 * The range request plugin makes it easy for a request with a 'Range' header to
 * be fulfilled by a cached response.
 *
 * It does this by intercepting the `cachedResponseWillBeUsed` plugin callback
 * and returning the appropriate subset of the cached response body.
 *
 * @memberof workbox-range-requests
 */
export default class RangeRequestsPlugin {
  /**
   * @param {Object} options
   * @param {Request} options.request The original request, which may or may not
   * contain a Range: header.
   * @param {Response} options.cachedResponse The complete cached response.
   * @return {Promise<Response>} If request contains a 'Range' header, then a
   * new response with status 206 whose body is a subset of `cachedResponse` is
   * returned. Otherwise, `cachedResponse` is returned as-is.
   *
   * @private
   */
  cachedResponseWillBeUsed = async ({
    request,
    cachedResponse,
  }) => {
    // Only return a sliced response if there's something valid in the cache,
    // and there's a Range: header in the request.
    if (cachedResponse && request.headers.has('range')) {
      return await createPartialResponse(request, cachedResponse);
    }

    // If there was no Range: header, or if cachedResponse wasn't valid, just
    // pass it through as-is.
    return cachedResponse;
  };
}

export function urlPattern({ request }) {
  const { destination } = request;

  return destination === 'video' || destination === 'audio';
}