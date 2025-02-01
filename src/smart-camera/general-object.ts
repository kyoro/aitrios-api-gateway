/*
 * Copyright 2023 Sony Semiconductor Solutions Corp. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// automatically generated by the FlatBuffers compiler, do not modify

import * as flatbuffers from 'flatbuffers';

import { BoundingBox, unionToBoundingBox, unionListToBoundingBox } from '../smart-camera/bounding-box';


export class GeneralObject {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):GeneralObject {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsGeneralObject(bb:flatbuffers.ByteBuffer, obj?:GeneralObject):GeneralObject {
  return (obj || new GeneralObject()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsGeneralObject(bb:flatbuffers.ByteBuffer, obj?:GeneralObject):GeneralObject {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new GeneralObject()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

classId():number {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readUint32(this.bb_pos + offset) : 0;
}

boundingBoxType():BoundingBox {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readUint8(this.bb_pos + offset) : BoundingBox.NONE;
}

boundingBox<T extends flatbuffers.Table>(obj:any):any|null {
  const offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.__union(obj, this.bb_pos + offset) : null;
}

score():number {
  const offset = this.bb!.__offset(this.bb_pos, 10);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 0.0;
}

static startGeneralObject(builder:flatbuffers.Builder) {
  builder.startObject(4);
}

static addClassId(builder:flatbuffers.Builder, classId:number) {
  builder.addFieldInt32(0, classId, 0);
}

static addBoundingBoxType(builder:flatbuffers.Builder, boundingBoxType:BoundingBox) {
  builder.addFieldInt8(1, boundingBoxType, BoundingBox.NONE);
}

static addBoundingBox(builder:flatbuffers.Builder, boundingBoxOffset:flatbuffers.Offset) {
  builder.addFieldOffset(2, boundingBoxOffset, 0);
}

static addScore(builder:flatbuffers.Builder, score:number) {
  builder.addFieldFloat32(3, score, 0.0);
}

static endGeneralObject(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

static createGeneralObject(builder:flatbuffers.Builder, classId:number, boundingBoxType:BoundingBox, boundingBoxOffset:flatbuffers.Offset, score:number):flatbuffers.Offset {
  GeneralObject.startGeneralObject(builder);
  GeneralObject.addClassId(builder, classId);
  GeneralObject.addBoundingBoxType(builder, boundingBoxType);
  GeneralObject.addBoundingBox(builder, boundingBoxOffset);
  GeneralObject.addScore(builder, score);
  return GeneralObject.endGeneralObject(builder);
}
}
