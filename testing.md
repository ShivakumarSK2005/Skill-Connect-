// API Calls 

    // 1.TEST YOUR SIGNUP API
    Method: POST
    URL: http://localhost:5000/api/auth/signup

    Body → JSON :
    {
    "name": "Shiva",
    "email": "shiva@gmail.com",
    "password": "12345678",
    "role": "customer",
    "phone": "9876543210"
    }

    // 2. TEST YOUR LOGIN API
    Method: POST
    URL: http://localhost:5000/api/auth/login

    Body → JSON :
    {
    "email": "shiva@gmail.com",
    "password": "12345678"
    }

    // 3. TEST YOUR Authentication MIDDLEWARE API
    Method: GET
    URL: http://localhost:5000/protected

    Header:
    Key: Authorization
    Value: Bearer YOUR_TOKEN

    // 5. TEST YOUR Authorization MIDDLEWARE API
    Method: GET
    URL: http://localhost:5000/provider-only        // for provider
    URL: http://localhost:5000/customer-only        // for customer

    Header:
    Key: Authorization
    Value:Bearer <provider_token>   // for provider
    Value:Bearer <customer_token>   // for customer

    // 4. to get all avilable service Types
    Method: GET
    URL: http://localhost:5000/api/services/types\

    // 5.Provider → Add Service API
    Method: POST
    URL: http://localhost:5000/api/services

    Header:
    Key: Authorization
    Value:Bearer <provider_token>

    Body → JSON :
    {
        "service_type_id": 5,
        "description": "Fast and reliable service",
        "price": 500
    }

    // 6. User to See All Avilable Services 
    Method: GET
    URL: http://localhost:5000/api/services


    // 7. Customer to Book Service 
    Method: POST
    URL: http://localhost:5000/api/bookings

    Header:
    Key: Authorization
    Value:Bearer <customer_token>

    Body → JSON :
    {
        "service_id": 1,
        "booking_date": "2026-03-25 10:00:00"
    }


    // 8. Provider → Accept / Reject Booking API
    Method: PUT
    URL: http://localhost:5000/api/bookings/Your_booking_id/status 
    here in above line replace Your_booking_id with your booking_id for which u wanna update status
    
    Header:
    Key: Authorization
    Value:Bearer <provider_token>

    Body → JSON : if u wanna Confirm booking 
    {
        "status": "confirmed"
    }
    
    Body → JSON : if u wanna Reject booking 
    {
        "status": "cancelled"
    }


    // 9. Customer to View All Bookings
    Method: GET
    URL: http://localhost:5000/api/bookings/my

    Header:
    Key: Authorization
    Value:Bearer <Customer_token>


    // 10 . Provider to View Incoming Bookings
    Method: GET
    URL: http://localhost:5000/api/bookings/provider

    Header:
    Key: Authorization
    Value:Bearer <provider_token>

    // 11. Provider to mark Service As Completed
    Method: PUT 
    URL: http://localhost:5000/api/bookings/Service_id_to be_Marked/complete
    Header:
    Key: Authorization
    Value:Bearer <provider_token>

    // 12. Customer To Add Review Once Service Is Completed
    Method: POST
    URL: http://localhost:5000/api/reviews

    Header:
    Key: Authorization
    Value:Bearer <Customer_token>

    Body → JSON :
    {
        "service_id": 4,
        "rating": 5,
        "comment": "Excellent service!"
    }

    // 13. PROVIDER → REQUEST START
    PUT http://localhost:5000/api/bookings/booking_id/request-start
    Authorization: Bearer <PROVIDER_TOKEN>

    // 14. CUSTOMER → CONFIRM START
    PUT http://localhost:5000/api/bookings/booking_id/confirm-start
    Authorization: Bearer <CUSTOMER_TOKEN>

    // 15. PROVIDER → COMPLETE SERVICE
    PUT http://localhost:5000/api/bookings/booking_id/complete
    Authorization: Bearer <PROVIDER_TOKEN>













//  Provider
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6InByb3ZpZGVyIiwiaWF0IjoxNzc0NjgxMDgzLCJleHAiOjE3NzQ3Njc0ODN9.xnett3QIQFj9gpSXods3RQOZrFsmQjtHt6M2SOYVAHM
// Customer 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzc0NjgxMDQ0LCJleHAiOjE3NzQ3Njc0NDR9.8lAXYyyXLD2Lsha523QEpk5Bb-bqZW3GZGrDTRQZ85c

