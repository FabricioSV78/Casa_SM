const now=new Date(), y=now.getFullYear(), m=String(now.getMonth()+1).padStart(2,'0')
export const users=[{id:'u1',nombre:'Karla',usuario:'admin',rol:'administradora'},{id:'u2',nombre:'Ada',usuario:'propietaria',rol:'propietaria'}]
export const tenants=[
 {id:'t1',nombre:'María López',documento:'44112233',celular:'987 321 654',correo:'',tipo:'persona',propiedadId:'p1',fechaInicio:`${y}-01-05`,precioMensual:650,diaPago:5,garantia:650,estado:'activo',observaciones:''},
 {id:'t2',nombre:'Carlos Huamán',documento:'70334455',celular:'956 112 889',correo:'carlos@email.com',tipo:'persona',propiedadId:'p2',fechaInicio:`${y}-02-01`,precioMensual:720,diaPago:1,garantia:720,estado:'activo',observaciones:'Pago por Yape'},
 {id:'t3',nombre:'Estudio Norte SAC',documento:'20601122334',celular:'999 220 110',correo:'pagos@estudionorte.pe',tipo:'empresa',propiedadId:'p4',fechaInicio:`${y}-01-01`,precioMensual:1450,diaPago:10,garantia:1450,estado:'activo',observaciones:''},
 {id:'t4',nombre:'Julia Ramos',documento:'',celular:'944 555 210',correo:'',tipo:'persona',propiedadId:'p3',fechaInicio:`${y}-03-15`,precioMensual:600,diaPago:15,garantia:600,estado:'activo',observaciones:''}
]
export const properties=[
 {id:'p1',codigo:'H-101',nombre:'Habitación 101',tipo:'habitación',ubicacion:'Primer piso',precioReferencial:650,estado:'ocupada',inquilinoActualId:'t1'},
 {id:'p2',codigo:'H-102',nombre:'Habitación 102',tipo:'habitación',ubicacion:'Primer piso',precioReferencial:720,estado:'ocupada',inquilinoActualId:'t2'},
 {id:'p3',codigo:'H-201',nombre:'Habitación 201',tipo:'habitación',ubicacion:'Segundo piso',precioReferencial:600,estado:'ocupada',inquilinoActualId:'t4'},
 {id:'p4',codigo:'O-01',nombre:'Oficina 01',tipo:'oficina',ubicacion:'Primer piso',precioReferencial:1450,estado:'ocupada',inquilinoActualId:'t3'},
 {id:'p5',codigo:'O-02',nombre:'Oficina 02',tipo:'oficina',ubicacion:'Segundo piso',precioReferencial:1250,estado:'disponible',inquilinoActualId:null},
 {id:'p6',codigo:'H-202',nombre:'Habitación 202',tipo:'habitación',ubicacion:'Segundo piso',precioReferencial:680,estado:'mantenimiento',inquilinoActualId:null}
]
export const movements=[
 {id:'m1',tipo:'ingreso',fechaMovimiento:`${y}-${m}-02`,monto:650,categoria:'Alquiler',concepto:'Mensualidad',inquilinoId:'t1',propiedadId:'p1',metodoPago:'Yape',tipoPago:'mensualidad',periodosRelacionados:`${y}-${m}`,usuarioId:'u1',estado:'activo'},
 {id:'m2',tipo:'ingreso',fechaMovimiento:`${y}-${m}-05`,monto:400,categoria:'Alquiler',concepto:'Pago parcial',inquilinoId:'t2',propiedadId:'p2',metodoPago:'Efectivo',tipoPago:'pago parcial',periodosRelacionados:`${y}-${m}`,usuarioId:'u1',estado:'activo'},
 {id:'m3',tipo:'gasto',fechaMovimiento:`${y}-${m}-07`,monto:185,categoria:'Luz',concepto:'Recibo de luz',inquilinoId:'',propiedadId:'',metodoPago:'Transferencia',tipoPago:'',periodosRelacionados:'',usuarioId:'u1',estado:'activo'},
 {id:'m4',tipo:'ingreso',fechaMovimiento:`${y}-${m}-10`,monto:2900,categoria:'Alquiler',concepto:'Dos meses de oficina',inquilinoId:'t3',propiedadId:'p4',metodoPago:'Transferencia',tipoPago:'varios meses',periodosRelacionados:`${y}-${m}, adelanto siguiente mes`,usuarioId:'u1',estado:'activo'},
 {id:'m5',tipo:'gasto',fechaMovimiento:`${y}-${m}-12`,monto:320,categoria:'Mantenimiento',concepto:'Reparación de cañería',inquilinoId:'',propiedadId:'p6',metodoPago:'Efectivo',tipoPago:'',periodosRelacionados:'',usuarioId:'u1',estado:'activo'},
 {id:'m6',tipo:'ingreso',fechaMovimiento:`${y}-${m}-15`,monto:600,categoria:'Alquiler',concepto:'Deuda del mes anterior',inquilinoId:'t4',propiedadId:'p3',metodoPago:'Plin',tipoPago:'deuda atrasada',periodosRelacionados:'Mes anterior',usuarioId:'u1',estado:'activo'}
]
export const obligations=[
 {id:'o1',inquilinoId:'t1',periodo:`${y}-${m}`,montoEsperado:650,montoPagado:650,saldoPendiente:0,estado:'pagado',fechaUltimoPago:`${y}-${m}-02`},
 {id:'o2',inquilinoId:'t2',periodo:`${y}-${m}`,montoEsperado:720,montoPagado:400,saldoPendiente:320,estado:'parcial',fechaUltimoPago:`${y}-${m}-05`},
 {id:'o3',inquilinoId:'t3',periodo:`${y}-${m}`,montoEsperado:1450,montoPagado:1450,saldoPendiente:0,estado:'adelantado',fechaUltimoPago:`${y}-${m}-10`},
 {id:'o4',inquilinoId:'t4',periodo:`${y}-${m}`,montoEsperado:600,montoPagado:0,saldoPendiente:600,estado:'pendiente',fechaUltimoPago:''}
]
