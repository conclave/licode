{
  'targets': [
  {
    'target_name': 'addon',
      'sources': [ 'addon.cc',
        'OneToManyProcessor.cc',
        'OneToManyTranscoder.cc',
        'ExternalInput.cc',
        'ExternalOutput.cc',
        'WebRtcConnection.cc' ],
      'include_dirs' : ['../../../liberizo', '$(PREFIX_DIR)/include'],
      'libraries': ['-L$(PREFIX_DIR)/lib', '-lerizo'],
      'conditions': [
        [ 'OS=="mac"', {
          'xcode_settings': {
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',        # -fno-exceptions
              'GCC_ENABLE_CPP_RTTI': 'YES',              # -fno-rtti
              'MACOSX_DEPLOYMENT_TARGET' : '10.7',      #from MAC OS 10.7
              'OTHER_CFLAGS': [
              '-g -O3 -stdlib=libc++',
              '-Wno-unused-private-field',
            ]
          },
        }, { # OS!="mac"
          'cflags!' : ['-fno-exceptions'],
          'cflags' : ['-D__STDC_CONSTANT_MACROS'],
          'cflags_cc' : ['-Wall', '-O3', '-g' , '-std=c++0x', '-fexceptions'],
          'cflags_cc!' : ['-fno-exceptions'], 
          'cflags_cc!' : ['-fno-rtti']
        }],
        ]
  }
  ]
}
