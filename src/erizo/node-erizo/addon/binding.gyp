{
  'targets': [{
    'target_name': 'addon',
    'sources': [ 'addon.cc',
      'CrossCallback.cc',
      'WebRtcConnection.cc',
      'OneToManyProcessor.cc',
      'OneToManyTranscoder.cc',
      'ExternalInput.cc',
      'ExternalOutput.cc' ],
    'include_dirs' : ['../../../liberizo', '$(PREFIX_DIR)/include'],
    'conditions': [
      [ 'OS=="mac"', {
        'xcode_settings': {
          'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',       # -fno-exceptions
          'GCC_ENABLE_CPP_RTTI': 'YES',             # -fno-rtti
          'MACOSX_DEPLOYMENT_TARGET' : '10.7',      # from MAC OS 10.7
          'OTHER_CFLAGS': [
            '-g -O3 -stdlib=libc++ -std=c++11',
            '-Wno-unused-private-field',
          ]
        },
        'libraries': ['-L../../../../../build/liberizo', '-lerizo'],
      }, { # OS!="mac"
        'cflags!':    ['-fno-exceptions'],
        'cflags':     ['-D__STDC_CONSTANT_MACROS'],
        'cflags_cc':  ['-Wall', '-O3', '-g' , '-std=c++11', '-fexceptions'],
        'cflags_cc!': ['-fno-exceptions'],
        'cflags_cc!': ['-fno-rtti'],
        'libraries':  ['-L$(PREFIX_DIR)/lib', '-lerizo'],
      }],
    ]
  }]
}
