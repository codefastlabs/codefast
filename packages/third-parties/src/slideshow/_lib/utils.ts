export function isVideoCompatible(): boolean {
  return !/(?<userAgent>Android|webOS|Phone|iPad|iPod|BlackBerry|Windows Phone)/i.test(navigator.userAgent);
}

export function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
