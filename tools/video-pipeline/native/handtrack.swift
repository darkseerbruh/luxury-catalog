// handtrack: detect a hand per frame with Apple Vision and print a position track.
// Usage: handtrack <video.mp4>
// Output (stdout): JSON [{ "t": seconds, "xPct": 0-100, "yPct": 0-100 }, ...]
// The point is the palm (average of wrist and middle-finger base), in TOP-LEFT
// percentage coordinates matching the rendered video. Frames with no confident
// hand are omitted; the consumer interpolates across gaps.
import AVFoundation
import Foundation
import Vision

func fail(_ msg: String) -> Never {
  FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
  exit(1)
}

let args = CommandLine.arguments
guard args.count >= 2 else { fail("usage: handtrack <video>") }
let url = URL(fileURLWithPath: args[1])
let asset = AVURLAsset(url: url)

guard let vtrack = asset.tracks(withMediaType: .video).first else { fail("no video track") }
guard let reader = try? AVAssetReader(asset: asset) else { fail("cannot read asset") }
let settings: [String: Any] = [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
]
let output = AVAssetReaderTrackOutput(track: vtrack, outputSettings: settings)
output.alwaysCopiesSampleData = false
reader.add(output)
reader.startReading()

let request = VNDetectHumanHandPoseRequest()
request.maximumHandCount = 1

let sampleInterval = 1.0 / 15.0  // sample ~15 fps
var lastT = -1.0
var track: [[String: Double]] = []

while reader.status == .reading, let sample = output.copyNextSampleBuffer() {
  let t = CMSampleBufferGetPresentationTimeStamp(sample).seconds
  if t.isNaN { continue }
  if t - lastT < sampleInterval { continue }
  lastT = t
  guard let pixel = CMSampleBufferGetImageBuffer(sample) else { continue }
  let handler = VNImageRequestHandler(cvPixelBuffer: pixel, orientation: .up, options: [:])
  try? handler.perform([request])
  guard let obs = request.results?.first as? VNHumanHandPoseObservation else { continue }

  func pt(_ j: VNHumanHandPoseObservation.JointName) -> VNRecognizedPoint? {
    let p = try? obs.recognizedPoint(j)
    return (p?.confidence ?? 0) > 0.3 ? p : nil
  }
  // Palm point: average wrist + middle finger base when both are present.
  let wrist = pt(.wrist)
  let mid = pt(.middleMCP)
  var loc: CGPoint?
  if let w = wrist, let m = mid {
    loc = CGPoint(x: (w.location.x + m.location.x) / 2, y: (w.location.y + m.location.y) / 2)
  } else if let w = wrist {
    loc = w.location
  } else if let m = mid {
    loc = m.location
  }
  guard let p = loc else { continue }
  // Vision coords: origin bottom-left, normalized 0..1. Flip Y to top-left.
  let xPct = Double(p.x) * 100.0
  let yPct = (1.0 - Double(p.y)) * 100.0
  track.append([
    "t": (t * 1000).rounded() / 1000,
    "xPct": (xPct * 10).rounded() / 10,
    "yPct": (yPct * 10).rounded() / 10,
  ])
}

let data = try JSONSerialization.data(withJSONObject: track, options: [.prettyPrinted])
FileHandle.standardOutput.write(data)
