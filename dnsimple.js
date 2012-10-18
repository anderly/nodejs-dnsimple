/*
DNSimple module for Node.js

Author:  Franklin van de Meent
Website: http://frankl.in/
Twitter: @unknownt

Source:  https://github.com/fvdm/nodejs-dnsimple

License: This module is copyleft meaning you can do anything you
         want except copyrighting it. It would be nice to refer
         back to https://github.com/fvdm/nodejs-dnsimple for
         later reference.
*/

var https = require('https')

// init
var app = {}

app.api = {
	hostname:	'dnsimple.com',
	email:		'',
	token:		'',
	password:	''
}


/////////
// DNS //
/////////

app.dns = {
	
	// List DNS records for domain
	list: function( domainname, callback ) {
		app.talk( 'GET', 'domains/'+ domainname +'/records', {}, function( records ) {
			var result = {}
			for( var r in records ) {
				result[ records[r].record.id ] = records[r].record
			}
			callback( result )
		})
	},
	
	// Show DNS record
	show: function( domainname, recordID, callback ) {
		app.talk( 'GET', 'domains/'+ domainname +'/records/'+ recordID, {}, function( record, status ) {
			if( status.label == 'success' ) {
				callback( record.record )
			} else {
				callback( record )
			}
		})
	},
	
	// Create DNS record
	// REQUIRED: name, record_type, content
	// OPTIONAL: ttl, prio
	add: function( domainname, record, callback ) {
		var post = { record: record }
		app.talk( 'POST', 'domains/'+ domainname +'/records', post, function( result, status ) {
			if( status.label == 'success' ) {
				callback( result.record )
			} else {
				callback( result )
			}
		})
	},
	
	// Update DNS record
	update: function( domainname, recordID, record, callback ) {
		var post = { record: record }
		app.talk( 'PUT', 'domains/'+ domainname +'/records/'+ recordID, post, function( result, status ) {
			if( status.label == 'success' ) {
				callback( result.record )
			} else {
				callback( result )
			}
		})
	},
	
	// Delete DNS record
	delete: function( domainname, recordID, callback ) {
		app.talk( 'DELETE', 'domains/'+ domainname +'/records/'+ recordID, {}, function( result, status ) {
			callback( result )
		})
	}

}



/////////////
// DOMAINS //
/////////////

app.domains = {
	
	// List domains, simple returns only array with domainnames
	list: function( simple, callback ) {
		var result = simple ? [] : {}
		app.talk( 'GET', 'domains', {}, function( domains, status ) {
			for( var d in domains ) {
				if( simple ) {
					result.push( domains[d].domain.name )
				} else {
					result[ domains[d].domain.id ] = domains[d].domain
				}
			}
			
			callback( result, status )
		})
	},
	
	// Find domains by regex match
	findByRegex: function( regex, callback ) {
		var result = {}
		app.domains.list( false, function( domains, status ) {
			if( status.label == 'success' ) {
				var regexp = new RegExp( regex )
				for( var d in domains ) {
					if( domains[d].name.match( regexp ) ) {
						result[ domains[d].id ] = domains[d]
					}
				}
				
				callback( result )
			}
		})
	},
	
	// Show domain
	show: function( domainname, callback ) {
		app.talk( 'GET', 'domains/'+ domainname, {}, function( domain, status ) {
			if( status.label == 'success' ) {
				callback( domain.domain )
			}
		})
	},
	
	// Add domain
	add: function( domainname, callback ) {
		var dom = { domain: { name: domainname } }
		app.talk( 'POST', 'domains', dom, function( domain, status ) {
			if( status.label == 'success' ) {
				callback( domain.domain )
			}
		})
	},
	
	// Delete domain
	delete: function( domainname, callback ) {
		app.talk( 'DELETE', 'domains/'+ domainname, {}, function( result ) {
			callback( result )
		})
	},
	
	
	//////////////////
	// REGISTRATION //
	//////////////////
	
	// Check availability
	check: function( domainname, callback ) {
		app.talk( 'GET', 'domains/'+ domainname +'/check', {}, function( result ) {
			callback( result )
		})
	},
	
	// Register domainname - auto-payment!
	register: function( domainname, registrantID, extendedAttribute, callback ) {
		var vars = {
			domain: {
				name:		domainname,
				registrant_id:	registrantID
			}
		}
		
		// fix 3 & 4 params
		if( !callback && typeof extendedAttribute == 'function' ) {
			var callback = extendedAttribute
		} else if( typeof extendedAttribute == 'object' ) {
			vars.domain.extended_attribute = extendedAttribute
		}
		
		// send
		app.talk( 'POST', 'domain_registrations', vars, function( result ) {
			callback( result )
		})
	},
	
	// Transfer domainname - auto-payment!
	transfer: function( domainname, registrantID, authinfo, callback ) {
		var vars = {
			domain: {
				name:		domainname,
				registrant_id:	registrantID
			}
		}
		
		// fix 3 & 4 params
		if( !callback && typeof authinfo == 'function' ) {
			var callback = authinfo
		} else if( typeof authinfo == 'string' ) {
			vars.transfer_order = {
				authinfo:	authinfo
			}
		}
		
		// send
		app.talk( 'POST', 'domain_transfers', vars, function( result ) {
			callback( result )
		})
	},
	
	// Renew domainname registration - auto-payment!
	renew: function( domainname, whoisPrivacy, callback ) {
		var vars = {
			domain: {
				name:		domainname
			}
		}
		
		// fix 2 & 3 params
		if( !callback && typeof whoisPrivacy == 'function' ) {
			var callback = whoisPrivacy
		} else {
			// string matching
			var whoisPrivacy = whoisPrivacy +''
			if( whoisPrivacy.match( /^(true|yes|1)$/i ) ) {
				vars.domain.renew_whois_privacy = 'true'
			} else if( whoisPrivate.match( /^(false|no|0)$/i ) ) {
				vars.domain.renew_whois_privacy = 'false'
			}
		}
		
		// send
		app.talk( 'POST', 'domain_renewal', vars, function( result ) {
			callback( result )
		})
	},
	
	// Set auto-renewal for domain
	autorenew: function( domainname, status, callback ) {
		var status = status +''
		if( status.match( /^(true|yes|on|enable|enabled|1)$/i ) ) {
			app.talk( 'POST', 'domains/'+ domainname +'/auto_renewal', {auto_renewal:{}}, function( result ) {
				callback( result )
			})
		} else if( status.match( /^(false|no|off|disable|disabled|0)$/i ) ) {
			app.talk( 'DELETE', 'domains/'+ domainname +'/auto_renewal', {}, function( result ) {
				callback( result )
			})
		}
	},
	
	// Prepare domain for transferring out
	transferout: function( domainname, callback ) {
		app.talk( 'POST', 'domains/'+ domainname +'/transfer_out', {}, function( result ) {
			callback( result )
		})
	},
	
	// Set nameservers at registry
	nameservers: function( domainname, nameservers, callback ) {
		var ns = {
			name_servers:	nameservers
		}
		app.talk( 'POST', 'domains/'+ domainname +'/name_servers', ns, function( result ) {
			callback( result )
		})
	},
	
	
	//////////////
	// SERVICES //
	//////////////
	
	// Services for domain
	services: {
		
		// already applied
		list: function( domainname, callback ) {
			app.talk( 'GET', 'domains/'+ domainname +'/applied_services', {}, function( result, status ) {
				if( status.label == 'success' ) {
					var services = {}
					for( var s in result ) {
						services[ result[s].service.id ] = result[s].service
					}
					callback( services )
				}
			})
		},
		
		// available
		available: function( domainname, callback ) {
			app.talk( 'GET', 'domains/'+ domainname +'/available_services', {}, function( result, status ) {
				if( status.label == 'success' ) {
					var services = {}
					for( var s in result ) {
						services[ result[s].service.id ] = result[s].service
					}
					callback( services )
				}
			})
		},
		
		// apply one
		add: function( domainname, serviceID, callback ) {
			var service = { service: { id: serviceID } }
			app.talk( 'POST', 'domains/'+ domainname +'/applied_services', service, function( result, status ) {
				callback( result )
			})
		},
		
		// delete one
		delete: function( domainname, serviceID, callback ) {
			app.talk( 'DELETE', 'domains/'+ domainname +'/applied_services/'+ serviceID, {}, function( result ) {
				callback( result )
			})
		}
	
	},
	
	
	// apply template -- alias for templates.apply
	template: function( domainname, templateID, callback ) {
		app.templates.apply( domainname, templateID, callback )
	}

}


//////////////
// SERVICES //
//////////////

app.services = {
	
	// List all supported services
	list: function( callback ) {
		app.talk( 'GET', 'services', {}, function( list, status ) {
			if( status.label == 'success' ) {
				var services = {}
				for( var s in list ) {
					services[ list[s].service.id ] = list[s].service
				}
				callback( services )
			}
		})
	},
	
	// Get one service' details
	show: function( serviceID, callback ) {
		app.talk( 'GET', 'services/'+ serviceID, {}, function( service, status ) {
			if( status.label == 'success' ) {
				callback( service.service )
			} else {
				callback( service )
			}
		})
	}
	
}


///////////////
// TEMPLATES //
///////////////

app.templates = {
	
	// List all of the custom templates in the account
	list: function( callback ) {
		app.talk( 'GET', 'templates', {}, function( list, status ) {
			if( status.label == 'success' ) {
				var templates = {}
				for( var t in list ) {
					templates[ list[t].dns_template.id ] = list[t].dns_template
				}
				callback( templates )
			}
		})
	},
	
	// Get a specific template
	show: function( templateID, callback ) {
		app.talk( 'GET', 'templates/'+ templateID, {}, function( template, status ) {
			if( status.label == 'success' ) {
				callback( template.dns_template )
			} else {
				callback( template )
			}
		})
	},
	
	// Create a custom template
	// REQUIRED: name, shortname
	// OPTIONAL: description
	add: function( template, callback ) {
		var set = { dns_template: template }
		app.talk( 'POST', 'templates', set, function( result, status ) {
			if( status.label == 'success' ) {
				callback( result.dns_template )
			} else {
				callback( result )
			}
		})
	},
	
	// Delete the given template
	delete: function( templateID, callback ) {
		app.talk( 'DELETE', 'templates/'+ templateID, {}, function( result ) {
			callback( result )
		})
	},
	
	// Apply a template to a domain
	apply: function( domainname, templateID, callback ) {
		app.talk( 'POST', 'domains/'+ domainname +'/templates/'+ templateID +'/apply', {}, function( result, status ) {
			if( status.label == 'success' ) {
				callback( result )
			} else {
				callback( result )
			}
		})
	},
	
	
	// records
	records: {
		
		// list records in template
		list: function( templateID, callback ) {
			app.talk( 'GET', 'templates/'+ templateID +'/template_records', {}, function( result, status ) {
				if( status.label == 'success' ) {
					var records = {}
					for( var r in result ) {
						records[ result[r].dns_template_record.id ] = result[r].dns_template_record
					}
					callback( records )
				} else {
					callback( result )
				}
			})
		},
		
		// Get one record for template
		show: function( templateID, recordID, callback ) {
			app.talk( 'GET', 'templates/'+ templateID +'/template_records/'+ recordID, {}, function( result, status ) {
				if( status.label == 'success' ) {
					callback( result.dns_template_record )
				} else {
					callback( result )
				}
			})
		},
		
		// Add record to template
		// REQUIRED: name, record_type, content
		// OPTIONAL: ttl, prio
		add: function( templateID, record, callback ) {
			var rec = { dns_template_record: record }
			app.talk( 'POST', 'templates/'+ templateID +'/template_records', rec, function( result, status ) {
				if( status.label == 'success' ) {
					callback( result.dns_template_record )
				} else {
					callback( result )
				}
			})
		},
		
		// Delete record from template
		delete: function( templateID, recordID, callback ) {
			app.talk( 'DELETE', 'templates/'+ templateID +'/template_records/'+ recordID, {}, function( result ) {
				callback( result )
			})
		}
		
	}

}

//////////////
// CONTACTS //
//////////////

app.contacts = {
	
	// list
	list: function( callback ) {
		app.talk( 'GET', 'contacts', {}, function( result ) {
			callback( result )
		})
	},
	
	// get one
	show: function( contactID, callback ) {
		app.talk( 'GET', 'contacts/'+ contactID, {}, function( result ) {
			callback( result )
		})
	},
	
	// create contact
	add: function( contact, callback ) {
		app.talk( 'POST', 'contacts', {contact: contact}, function( result ) {
			callback( result )
		})
	}
	
}


////////////
// MODULE //
////////////

// communicate
app.talk = function( method, path, fields, callback ) {
	
	if( !callback && typeof fields === 'function' ) {
		var callback = fields
		var fields = {}
	}
	
	// prepare
	var querystr = JSON.stringify(fields)
	var headers = {
		'Accept':	'application/json',
		'User-Agent':	'Nodejs-DNSimple'
	}
	
	// token in headers
	if( app.api.token != '' ) {
		headers['X-DNSimple-Token'] = app.api.email +':'+ app.api.token
	}
	
	if( method.match( /(POST|PUT|DELETE)/ ) ) {
		headers['Content-Type']		= 'application/json'
		headers['Content-Length']	= querystr.length
	}
	
	var options = {
		host:		app.api.hostname,
		port:		443,
		path:		'/'+ path,
		method:		method,
		headers:	headers,
		agent:		false
	}
	
	// password authentication
	if( app.api.token == '' && app.api.password != '' ) {
		options.auth = app.api.email +':'+ app.api.password
	}
	
	// build request
	var req = https.request( options, function( response ) {
			
			// process response
			var data = ''
			var status = {}
			
			response.on( 'data', function( chunk ) { data += chunk })
			
			// request finished
			response.on( 'end', function() {
				
				// parse status
				if( response.headers.status !== undefined ) {
					// from header
					status.code = parseInt( response.headers.status.substr(0,3) )
					status.text = response.headers.status ? response.headers.status : ''
				data = data.toString('utf8').trim()
				} else {
					// from body
					data.replace( /<title>(([\d]{3}) ([^<]+))<\/title>/, function( m, text, code, t ) {
						status.code = parseInt( code )
						status.text = text
					})
				}
				
				if( status.code >= 100 && status.code < 300 ) {
					status.label = 'success'
				} else if( status.code >= 300 && status.code < 400 ) {
					status.label = 'redirection'
				} else if( status.code >= 400 && status.code < 500 ) {
					status.label = 'error'
				} else if( status.code >= 500 && status.code < 600 ) {
					status.label = 'fail'
				} else if( status.code < 100 || !status.code.match( /^[0-9]{3}$/ ) ) {
					status.label = 'fatal'
				}
				
				if( status.label.match( /^(fatal|fail)$/ ) {
					
					// Panda Alert
					status.details = {
						request: {
							options: options,
							body: querystr
						},
						response: {
							headers: response.headers,
							body: data
						}
					}
					
					callback( {}, status )
					
				} else {
					
					// looks fine
					data = data.match( /^[\[\{]/ ) ? JSON.parse( data ) : {}
					callback( data, status )
					
				}
			})
			
		}
	)
	
	// error
	req.on( 'error', function( error ) {
		callback( error, 'request error' )
	})
	
	// post and close
	if( method.match( /(POST|PUT|DELETE)/ ) ) {
		req.write( querystr )
	}
	
	req.end()
	
}

// all done
module.exports = app