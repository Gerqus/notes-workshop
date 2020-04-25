export function freezeDeep(obj: Object) {
  Object.getOwnPropertyNames(obj).forEach(propName => {
    if (typeof(obj[propName]) === 'object') {
      obj[propName] = freezeDeep(obj[propName]);
    }
  });
  return Object.freeze(obj);
}

export function joinURLSegments(...urlSegments: string[]) {
  const normalizedElements = urlSegments.map(segment => {
    while(segment.charAt(0) === '/') {
      segment = segment.substr(1);
    }
    while(segment.charAt(segment.length - 1) === '/') {
      segment = segment.substr(0, segment.length - 1);
    }
    return segment;
  })
  return normalizedElements.join('/');
}