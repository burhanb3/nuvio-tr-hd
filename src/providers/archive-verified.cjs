'use strict';
const { matchesIdentity } = require('../matching.cjs');

// Narrow repairs for incomplete/incorrect Archive metadata. Evidence is in
// compatibility/content-163.json and content-164.json. Exact files, not aliases.
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
    files:[
      { name:'Fleabag.S01E01.480p.WEB-DL.Tehmovies.biz.mkv', size:103770149, sha1:'c783319a7077fd2b9a41b529e537bfeeeb2d5b4d', hash:'cb34679d109bcf50', width:848, height:354, duration:1564.874 },
      { name:'Fleabag.S01E01.480p.WEB-DL.Tehmovies.biz.mp4', original:'Fleabag.S01E01.480p.WEB-DL.Tehmovies.biz.mkv', size:162737999, sha1:'7e8083c62d4b4161f74385bcd3cd5d15867b7c12', hash:'8e6bf44636bf0129', width:848, height:354, duration:1564.866 }
    ]
  },
  {
    identity: { tmdbId:1396, imdbId:'tt0903747', originalTitle:'Breaking Bad', year:2008, type:'tv', season:1, episode:1 },
    item:'breaking-bad-s-01e-01-720p.-brrip.-sujaidr_202411',
    files:[
      { name:'Breaking Bad s01e01 720p.BRrip.Sujaidr.mkv', size:487194215, sha1:'b40be1b6f824e49ae65b4159aa66994a573438f4', hash:'413c8dd909a585e5', width:1280, height:720, duration:3486.44175 },
      { name:'Breaking Bad s01e01 720p.BRrip.Sujaidr.mp4', original:'Breaking Bad s01e01 720p.BRrip.Sujaidr.mkv', size:344478919, sha1:'917145d4d613abcb9dab30d0c25575f27875dad0', hash:'ceadfd558a25d8bd', width:853, height:480, duration:3486.592 }
    ]
  },
  {
    identity: { tmdbId:27205, imdbId:'tt1375666', originalTitle:'Inception', year:2010, type:'movie' },
    item:'a.-origem.-2010.baixarfilmesretro.blogspot.com-1',
    files:[
      { name:'A.Origem.[2010].baixarfilmesretro.blogspot.com (1).mp4', size:902428472, sha1:'988398362ed184ef3ab9c3d81b603f20d4747dc8', hash:'631861977ab6e240', width:1280, height:536, duration:8888.086666666666 },
      { name:'A.Origem.[2010].baixarfilmesretro.blogspot.com (1).ia.mp4', original:'A.Origem.[2010].baixarfilmesretro.blogspot.com (1).mp4', size:869895874, sha1:'65e2c5f9cd5caa8ab3089db2adec365330cd5892', hash:'42a8f8835109f629', width:1280, height:536, duration:8888.088 }
    ]
  },
  {
    identity: { tmdbId:67070, imdbId:'tt5687612', originalTitle:'Fleabag', year:2016, type:'tv', season:2, episode:1 },
    item:'fleabag.-s-01-e-05.-hdtv.-subtitulado-esp.-sc',
    burnedSubtitleLanguage:'es',
    files:[
      { name:'Fleabag Season 2/FL34B4G SUB T02XE01.mkv', size:633782892, sha1:'c03771c90754fc202f30fd4b091ff997d225f5ae', hash:'3b9c37b915e36b3b', width:1280, height:720, duration:1531.389 },
      { name:'Fleabag Season 2/FL34B4G SUB T02XE01.mp4', original:'Fleabag Season 2/FL34B4G SUB T02XE01.mkv', size:154176179, sha1:'936487684937f18a46e3146801c6c725e9693ef9', hash:'a90bdbfc69a01f2d', width:853, height:480, duration:1531.455 }
    ]
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
