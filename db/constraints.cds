using { sap.capire.travels as my } from './schema';

annotate my.Travels with {
  @mandatory BeginDate;
  @mandatory EndDate;
  @mandatory Agency;
  @mandatory Customer;
  @assert: (case
    when Description is null  then 'ASSERT_NOT_NULL'
    when trim(Description)='' then 'ASSERT_FORMAT("'||Description||'","not empty string")'
  end)
  Description;
  @assert: (case
    // when price is not null and not price between 0 and 500 then 'must be between 0 and 500'
    when BookingFee <= 0 or BookingFee > 500 then 'ASSERT_RANGE('||BookingFee||',0,500)'
  end)
  BookingFee;
  @assert: (case
    when Customer is null then null // genre may be null
    when not exists Customer then 'ASSERT_TARGET'
  end)
  Customer;
  @assert: (case
    when sum(Bookings.FlightPrice) > 99999999 then ID || ' already earned too much with their books'
    when count(Bookings.Pos) -1 > 10000 then ID || ' already wrote too many books'
  end)
  Bookings
}

annotate my.Bookings with {
  @mandatory Flight;
  @mandatory Travel;
}

annotate my.Travels with @Capabilities.FilterRestrictions.FilterExpressionRestrictions: [
  { Property: 'BeginDate', AllowedExpressions : 'SingleRange' },
  { Property: 'EndDate', AllowedExpressions : 'SingleRange' }
];

