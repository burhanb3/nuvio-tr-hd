'use strict';
const { matchesIdentity } = require('../matching.cjs');

// Narrow repairs for incomplete/incorrect Archive metadata. Evidence is in
// compatibility/content-163.json. These are exact files, not title aliases.
// Every use still requires live metadata, byte ranges, duration and file hash.
const records = [
  {
    identity: { tmdbId:438631, imdbId:'tt1160419', originalTitle:'Dune', year:2021, type:'movie' },
    item:'dune-2021-720p-blu-ray-x-265-hevc-10bit-aac-2-0-hindi-psa-asap_202507',
    files:[
      { name:'Dune_2021_720p_BluRay_x265_HEVC_10bit_AAC_2_0_Hindi_PSA_ASAP.mkv', size:792903325, sha1:'8eb58e3a244f674722711c8a3e6ae156f53a3e99', hash:'5dc700e2edad6a26', width:1280, height:536, duration:9326.659 },
      { name:'Dune_2021_720p_BluRay_x265_HEVC_10bit_AAC_2_0_Hindi_PSA_ASAP.mp4', original:'Dune_2021_720p_BluRay_x265_HEVC_10bit_AAC_2_0_Hindi_PSA_ASAP.mkv', size:949160267, sha1:'8a52e212458cfcb5e73c57becd0536cc0db75313', hash:'3a6a5b1f9566a857', width:1146, height:480, duration:9326.698 }
    ]
  },
  {
    identity: { tmdbId:67070, imdbId:'tt5687612', originalTitle:'Fleabag', year:2016, type:'tv', season:1, episode:1 },
    item:'fleabag.s01e01.480p.webdl.tehmovies.biz',
    files:[{ name:'Fleabag.S01E01.480p.WEB-DL.Tehmovies.biz.mkv', size:103770149, sha1:'c783319a7077fd2b9a41b529e537bfeeeb2d5b4d', hash:'cb34679d109bcf50', width:848, height:354, duration:1564.874 }]
  }
];
function verifiedArchiveRecords(target) {
  return records.filter(r => matchesIdentity(r.identity,target) && r.identity.imdbId === target.imdbId);
}
function verifiedMetadataFile(record, file) {
  return record?.files.find(f => f.name===file.name && Number(file.size)===f.size && file.sha1===f.sha1 &&
    (!f.original || file.original===f.original)) || null;
}
module.exports = { verifiedArchiveRecords, verifiedMetadataFile };
